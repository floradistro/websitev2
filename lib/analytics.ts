// Analytics event tracking utilities
// Works with Google Analytics 4, Google Tag Manager, or any analytics platform

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export const analytics = {
  // Track page view
  pageView: (url: string) => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("config", "G-XXXXXXXXXX", {
        page_path: url,
      });
    }
  },

  // Track add to cart event
  addToCart: (product: {
    id: number | string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
  }) => {
    if (typeof window !== "undefined") {
      // Google Analytics 4
      if (window.gtag) {
        window.gtag("event", "add_to_cart", {
          currency: "USD",
          value: product.price * product.quantity,
          items: [
            {
              item_id: product.id,
              item_name: product.name,
              price: product.price,
              quantity: product.quantity,
              item_category: product.category,
            },
          ],
        });
      }

      // Facebook Pixel (if installed)
      if ((window as any).fbq) {
        (window as any).fbq("track", "AddToCart", {
          content_ids: [product.id],
          content_name: product.name,
          content_type: "product",
          value: product.price * product.quantity,
          currency: "USD",
        });
      }

      }
  },

  // Track remove from cart event
  removeFromCart: (product: {
    id: number | string;
    name: string;
    price: number;
    quantity: number;
  }) => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "remove_from_cart", {
        currency: "USD",
        value: product.price * product.quantity,
        items: [
          {
            item_id: product.id,
            item_name: product.name,
            price: product.price,
            quantity: product.quantity,
          },
        ],
      });
      }
  },

  // Track begin checkout event
  beginCheckout: (cart: {
    items: any[];
    total: number;
  }) => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "begin_checkout", {
        currency: "USD",
        value: cart.total,
        items: cart.items.map((item) => ({
          item_id: item.productId,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      });
      }
  },

  // Track purchase event
  purchase: (order: {
    orderId: string;
    total: number;
    tax?: number;
    shipping?: number;
    items: any[];
  }) => {
    if (typeof window !== "undefined") {
      // Google Analytics 4
      if (window.gtag) {
        window.gtag("event", "purchase", {
          transaction_id: order.orderId,
          value: order.total,
          tax: order.tax || 0,
          shipping: order.shipping || 0,
          currency: "USD",
          items: order.items.map((item) => ({
            item_id: item.productId,
            item_name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        });
      }

      // Facebook Pixel
      if ((window as any).fbq) {
        (window as any).fbq("track", "Purchase", {
          value: order.total,
          currency: "USD",
          content_ids: order.items.map((item) => item.productId),
        });
      }

      }
  },

  // Track product view
  viewProduct: (product: {
    id: number | string;
    name: string;
    price: number;
    category?: string;
  }) => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "view_item", {
        currency: "USD",
        value: product.price,
        items: [
          {
            item_id: product.id,
            item_name: product.name,
            price: product.price,
            item_category: product.category,
          },
        ],
      });
      }
  },

  // Track search
  search: (searchTerm: string) => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "search", {
        search_term: searchTerm,
      });
      }
  },

  // Custom event tracking
  event: (eventName: string, params?: any) => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", eventName, params);
      }
  },
};

