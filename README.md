# eTracking.store - Delivery Tracking for Small Businesses

A simple, real-time delivery tracking system for Sri Lankan small businesses.

## Features

- **Shop Owner Dashboard**: Manage orders, assign drivers, and track deliveries
- **Driver Dashboard**: Mobile-friendly interface for drivers to update delivery status
- **Customer Tracking**: Real-time order status updates for customers
- **Admin Panel**: Manage shops, drivers, and monitor system usage
- **SMS Notifications**: Automated SMS alerts for customers at every stage of delivery

## Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Real-time Updates**: Supabase Realtime
- **SMS Integration**: Ready for integration with local SMS providers

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/etracking.git
   cd etracking
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

4. Set up your Supabase database using the SQL schema in `supabase/schema.sql`

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses the following tables:

- **profiles**: User profiles for shop owners, drivers, and admins
- **customers**: Customer information
- **orders**: Order details and status
- **order_history**: Timeline of order status changes
- **sms_logs**: Record of SMS notifications sent
- **sms_packs**: SMS credit packs purchased by shop owners

## Deployment

This application can be easily deployed to Vercel:

```bash
npm run build
vercel --prod
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Built with Next.js and Supabase
- Designed for small businesses in Sri Lanka
