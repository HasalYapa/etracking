# Next.js 15 Portfolio Website

A modern, responsive portfolio website built with Next.js 15, TypeScript, Tailwind CSS, and Shadcn/UI components. Features dark mode support, smooth animations, blog integration with Notion, contact form with Supabase, and CV download functionality.

## ✨ Features

- **Modern Design**: Clean, professional design with dark/light mode support
- **Responsive**: Fully responsive across all devices
- **Fast Performance**: Built with Next.js 15 for optimal performance
- **Smooth Animations**: Beautiful animations with Framer Motion
- **Contact Form**: Integrated contact form with Supabase backend
- **Blog Integration**: Optional blog powered by Notion API
- **CV Download**: Easy CV/resume download functionality
- **SEO Optimized**: Built-in SEO optimization with Next.js metadata API
- **TypeScript**: Full type safety throughout the application
- **Accessibility**: WCAG compliant and keyboard navigable

## 🚀 Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/UI + Radix UI
- **Animations**: Framer Motion
- **Database**: Supabase (for contact form)
- **CMS**: Notion API (for blog posts)
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation
- **Theme**: next-themes for dark mode

## 📁 Project Structure

```
your-portfolio/
├── public/
│   ├── cv/
│   │   └── resume.pdf          # Your CV/resume file
│   └── favicon.ico
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── about/
│   │   ├── blog/
│   │   ├── contact/
│   │   ├── projects/
│   │   ├── api/
│   │   │   └── contact/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                 # Shadcn/UI components
│   │   ├── navbar.tsx
│   │   ├── footer.tsx
│   │   ├── theme-provider.tsx
│   │   └── theme-toggle.tsx
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── supabase.ts
│   │   └── notion.ts
│   └── types/
│       └── index.ts
├── .env.local                  # Environment variables
├── tailwind.config.js
├── tsconfig.json
├── next.config.js
└── package.json
```

## 🛠️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/nextjs-portfolio.git
cd nextjs-portfolio
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
# Supabase (required for contact form)
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Notion (optional - for blog)
NOTION_API_KEY=your-notion-api-key
NOTION_DATABASE_ID=your-notion-database-id

# Contact form email (optional)
CONTACT_EMAIL=your-email@example.com
```

### 4. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Create a `contacts` table with the following columns:
   - `id` (uuid, primary key)
   - `name` (text)
   - `email` (text)
   - `message` (text)
   - `created_at` (timestamp)

SQL to create the table:
```sql
CREATE TABLE contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. Set up Notion (Optional)

1. Create a Notion integration at [notion.so/integrations](https://notion.so/integrations)
2. Create a database in Notion with the following properties:
   - `Title` (Title)
   - `Slug` (Rich Text)
   - `Excerpt` (Rich Text)
   - `Published` (Checkbox)
   - `Published At` (Date)
   - `Tags` (Multi-select)
   - `Cover Image` (Files)

### 6. Add your CV

Replace the placeholder file at `public/cv/resume.pdf` with your actual CV/resume.

### 7. Customize content

Edit the following files to customize the portfolio:
- `src/app/page.tsx` - Home page content
- `src/app/about/page.tsx` - About page content
- `src/app/projects/page.tsx` - Projects data
- `src/components/navbar.tsx` - Navigation links
- `src/components/footer.tsx` - Footer content
- `src/app/layout.tsx` - Site metadata

### 8. Start the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎨 Customization

### Colors & Themes

The project uses CSS variables for theming. Customize colors in `src/app/globals.css`:

```css
:root {
  --primary: your-primary-color;
  --secondary: your-secondary-color;
  /* ... */
}
```

### Components

All UI components are built with Shadcn/UI and can be customized in the `src/components/ui/` directory.

### Content

- **Personal Information**: Update in `src/app/layout.tsx` metadata
- **Projects**: Modify the projects array in `src/app/projects/page.tsx`
- **Skills**: Update in `src/app/about/page.tsx`
- **Social Links**: Update in `src/components/footer.tsx` and `src/components/navbar.tsx`

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add your environment variables in the Vercel dashboard
4. Deploy!

### Deploy to Netlify

1. Push your code to GitHub
2. Connect your repository to [Netlify](https://netlify.com)
3. Add your environment variables in the Netlify dashboard
4. Deploy!

### Other Platforms

The project can be deployed to any platform that supports Next.js:
- AWS Amplify
- Railway
- Heroku
- DigitalOcean App Platform

## 📝 Content Management

### Blog Posts (Notion)

If you've set up Notion:
1. Add new pages to your Notion database
2. Set `Published` to true
3. The blog will automatically fetch and display your posts

### Projects

Add new projects by updating the `projects` array in `src/app/projects/page.tsx`:

```typescript
{
  id: "unique-id",
  title: "Project Title",
  description: "Short description",
  technologies: ["Next.js", "TypeScript"],
  githubUrl: "https://github.com/...",
  liveUrl: "https://...",
  imageUrl: "https://...",
  category: "web",
  status: "completed",
  featured: true,
  startDate: "2024-01-01",
  endDate: "2024-02-01",
}
```

## 🔧 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing framework
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Shadcn/UI](https://ui.shadcn.com/) for beautiful components
- [Framer Motion](https://framer.com/motion/) for smooth animations
- [Supabase](https://supabase.com/) for the backend
- [Notion](https://notion.so/) for content management

## 📞 Support

If you have any questions or need help with setup, please open an issue or reach out via the contact form on the website.

---

⭐ If you found this project helpful, please consider giving it a star on GitHub! 