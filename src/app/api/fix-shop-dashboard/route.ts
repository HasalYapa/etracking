import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const shopDashboardPath = path.join(process.cwd(), 'src', 'app', 'shop-dashboard', 'page.tsx');
    
    // Check if file exists
    if (!fs.existsSync(shopDashboardPath)) {
      return NextResponse.json({ error: 'Shop dashboard file not found' }, { status: 404 });
    }

    // Read current content
    const currentContent = fs.readFileSync(shopDashboardPath, 'utf8');
    
    // Create backup
    const backupPath = path.join(process.cwd(), 'src', 'app', 'shop-dashboard', 'page.tsx.bak');
    fs.writeFileSync(backupPath, currentContent);

    // Replace mock data with real data
    let updatedContent = currentContent;
    
    // Replace mock data loading with real data loading
    if (updatedContent.includes('const loadShopOrders = async (shopId)')) {
      updatedContent = updatedContent.replace(
        /const loadShopOrders = async \(shopId\) => \{[\s\S]*?try \{[\s\S]*?console\.log\('Loading orders for shop ID:', shopId\);[\s\S]*?\/\/ In a real implementation[\s\S]*?\/\/ Filter orders by shop ID[\s\S]*?const shopOrders = allMockOrders\.filter[\s\S]*?setOrders\(shopOrders\);[\s\S]*?\/\/ Calculate stats[\s\S]*?setStats\(\{[\s\S]*?total: shopOrders\.length,[\s\S]*?\}\);[\s\S]*?\} catch \(err\) \{[\s\S]*?\}/,
        `const loadShopOrders = async (shopId) => {
    try {
      console.log('Loading orders for shop ID:', shopId);
      
      // Fetch real orders from Supabase
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(\`
          *,
          customers(*),
          drivers:profiles(id, name, email, phone)
        \`)
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading shop orders:', error);
        return;
      }
      
      console.log(\`Found \${ordersData.length} orders for shop ID \${shopId}\`);
      setOrders(ordersData || []);
      
      // Calculate stats
      const total = ordersData.length;
      const pending = ordersData.filter(order => order.status === 'pending').length;
      const inTransit = ordersData.filter(order => 
        order.status === 'in_transit' || order.status === 'assigned' || order.status === 'picked_up'
      ).length;
      const delivered = ordersData.filter(order => order.status === 'delivered').length;
      
      setStats({
        total,
        pending,
        in_transit: inTransit,
        delivered
      });
    } catch (err) {
      console.error('Error loading shop orders:', err);
    }`
      );
    }
    
    // Replace mock order creation with real order creation
    if (updatedContent.includes('// In a real implementation, we would save to Supabase:')) {
      updatedContent = updatedContent.replace(
        /\/\/ In a real implementation, we would save to Supabase:[\s\S]*?\/\/ const \{ data, error \} = await supabase[\s\S]*?\/\/   \.from\('orders'\)[\s\S]*?\/\/   \.insert\(\{[\s\S]*?\/\/   \}\);[\s\S]*?\/\/ Add to orders[\s\S]*?setOrders\(prev => \[newOrderData, ...prev\]\);/,
        `// Create a real order in Supabase
      const { data, error } = await supabase
        .from('orders')
        .insert({
          tracking_number: newOrderData.tracking_number,
          shop_id: profile.id,
          customer_id: customer.id,
          status: 'pending',
          delivery_address: newOrder.delivery_address,
          delivery_notes: newOrder.items,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error creating order:', error);
        alert('Failed to create order: ' + error.message);
        return;
      }
      
      // Create order history
      const { error: historyError } = await supabase
        .from('order_history')
        .insert({
          order_id: data.id,
          status: 'pending',
          notes: 'Order created',
          created_at: new Date().toISOString(),
          updated_by: profile.id
        });
        
      if (historyError) {
        console.error('Error creating order history:', historyError);
      }
      
      // Add to orders
      setOrders(prev => [data, ...prev]);`
      );
    }
    
    // Remove mock data declarations
    if (updatedContent.includes('const allMockOrders = [')) {
      updatedContent = updatedContent.replace(
        /const allMockOrders = \[[\s\S]*?\];/,
        '// Real orders are fetched from Supabase'
      );
    }
    
    // Write updated content
    fs.writeFileSync(shopDashboardPath, updatedContent);

    return NextResponse.json({ 
      success: true, 
      message: 'Shop dashboard updated to use real data',
      backupCreated: true,
      backupPath: backupPath
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
