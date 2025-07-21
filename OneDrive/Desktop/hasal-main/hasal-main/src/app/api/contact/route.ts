import { NextRequest, NextResponse } from 'next/server'
import { submitContactForm } from '@/lib/supabase'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, message } = body

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Submit to Supabase
    const result = await submitContactForm({ name, email, message })

    // Send email notification using Resend
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      
      if (process.env.RESEND_API_KEY && process.env.CONTACT_EMAIL) {
        await resend.emails.send({
          from: 'onboarding@resend.dev', // Resend's verified domain for testing
          to: [process.env.CONTACT_EMAIL],
          replyTo: email, // Set reply-to as the person who submitted the form
          subject: `New Contact Form Message from ${name}`,
          html: `
            <h2>New Contact Form Message</h2>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>From:</strong> ${name}</p>
              <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <h3>Message:</h3>
            <div style="background: white; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
              This message was sent from your portfolio contact form at hasal.digital<br>
              You can reply directly to this email to respond to ${name}
            </p>
          `,
        })
        
        console.log('Email sent successfully to:', process.env.CONTACT_EMAIL)
      } else {
        console.log('Email not sent - Resend API key or contact email not configured')
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError)
      // Don't fail the entire request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for your message! I will get back to you soon.',
      data: result,
    })
  } catch (error) {
    console.error('Contact form submission error:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Something went wrong. Please try again later.'
    
    if (error instanceof Error) {
      if (error.message.includes('relation "contacts" does not exist')) {
        errorMessage = 'Database table not found. Please contact the administrator.'
      } else if (error.message.includes('permission denied')) {
        errorMessage = 'Database permission error. Please contact the administrator.'
      } else if (error.message.includes('Supabase error')) {
        errorMessage = `Database error: ${error.message}`
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
} 