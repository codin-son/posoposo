export interface User {
  id: string;
  username: string;
  role: 'superadmin' | 'boss' | 'staff';
  fullName: string;
  full_name?: string;
  phone?: string;
  is_active?: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category_id?: string;
  category_name?: string;
  image_url?: string;
  is_available: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  display_order: number;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export type OrderStatus = 'IN_PROGRESS' | 'READY' | 'COMPLETED' | 'CANCELLED';

export interface Order {
  id: string;
  order_number: number;
  customer_name?: string;
  staff_id: string;
  staff_name?: string;
  subtotal: number;
  discount_id?: string;
  discount_amount: number;
  sst_amount: number;
  total_amount: number;
  payment_received?: number;
  change_given?: number;
  payment_method?: string;
  notes?: string;
  created_at: string;
  status: OrderStatus;
  paid_at?: string;
  items?: OrderItemDetail[];
}

export interface OrderItemDetail {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes?: string;
}

export interface Discount {
  id: string;
  code?: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  is_active: boolean;
  expiry_date?: string;
}

export interface Attendance {
  id: string;
  user_id: string;
  full_name?: string;
  username?: string;
  clock_in?: string;
  clock_out?: string;
  clock_in_selfie?: string;
  clock_out_selfie?: string;
  status: 'present' | 'late' | 'absent' | 'leave';
  notes?: string;
  date: string;
}

export interface DailyAnalytics {
  summary: {
    total_orders: number;
    total_sales: number;
    total_discounts: number;
    average_order: number;
  };
  hourlyData: { hour: number; orders: number; sales: number }[];
  topItems: { item_name: string; total_quantity: number; total_sales: number }[];
  paymentMethods: { payment_method: string; count: number; total: number }[];
}

export interface WeeklyAnalytics {
  summary: {
    total_orders: number;
    total_sales: number;
    average_order: number;
  };
  dailyData: { date: string; orders: number; sales: number }[];
  topItems: { item_name: string; total_quantity: number; total_sales: number }[];
}

export interface MonthlyAnalytics {
  summary: {
    total_orders: number;
    total_sales: number;
    total_discounts: number;
    average_order: number;
  };
  dailyData: { date: string; orders: number; sales: number }[];
  categoryData: { category: string; total_quantity: number; total_sales: number }[];
  topItems: { item_name: string; total_quantity: number; total_sales: number }[];
  comparison: { current_month: number; previous_month: number };
}
