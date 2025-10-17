import axios from "axios";

const baseUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://api.floradistro.com";
const consumerKey = process.env.NEXT_PUBLIC_WORDPRESS_CONSUMER_KEY || "ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5";
const consumerSecret = process.env.NEXT_PUBLIC_WORDPRESS_CONSUMER_SECRET || "cs_38194e74c7ddc5d72b6c32c70485728e7e529678";

export const wooCommerceClient = axios.create({
  baseURL: `${baseUrl}/wp-json/wc/v3`,
  params: {
    consumer_key: consumerKey,
    consumer_secret: consumerSecret,
  },
});

// Customer endpoints
export async function getCustomerByEmail(email: string) {
  try {
    const response = await wooCommerceClient.get('/customers', {
      params: { email }
    });
    return response.data[0] || null;
  } catch (error) {
    console.error('Error fetching customer:', error);
    return null;
  }
}

export async function createCustomer(data: {
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  password: string;
}) {
  try {
    const response = await wooCommerceClient.post('/customers', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to create customer');
  }
}

export async function updateCustomer(id: number, data: any) {
  try {
    const response = await wooCommerceClient.put(`/customers/${id}`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update customer');
  }
}

export async function getCustomerOrders(customerId: number) {
  try {
    const response = await wooCommerceClient.get('/orders', {
      params: {
        customer: customerId,
        per_page: 100,
        orderby: 'date',
        order: 'desc',
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

