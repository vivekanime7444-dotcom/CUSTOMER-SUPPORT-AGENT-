export const PRODUCTS = [
  {
    id: 'p1',
    name: 'NovaPhone X',
    category: 'Smartphones',
    description: 'The latest flagship smartphone with a stunning OLED display and advanced camera system.',
    price: 899.99,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=80',
    stock: 45,
    rating: 4.8,
    specifications: {
      Screen: '6.7" OLED',
      Storage: '256GB',
      Battery: '4500mAh',
      Camera: '48MP Main'
    }
  },
  {
    id: 'p2',
    name: 'NovaBook Pro 15',
    category: 'Laptops',
    description: 'High-performance laptop for professionals and creators. Features the new M2 chip.',
    price: 1499.00,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80',
    stock: 12,
    rating: 4.9,
    specifications: {
      Processor: 'M2 Octa-core',
      RAM: '16GB Unified',
      Storage: '512GB SSD',
      Display: '15.6" Retina'
    }
  },
  {
    id: 'p3',
    name: 'SonicBuds Active',
    category: 'Headphones',
    description: 'True wireless earbuds with active noise cancellation and 24-hour battery life.',
    price: 149.99,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=80',
    stock: 120,
    rating: 4.6,
    specifications: {
      Type: 'In-ear True Wireless',
      Battery: '6h (24h with case)',
      ANC: 'Yes',
      WaterResistance: 'IPX4'
    }
  },
  {
    id: 'p4',
    name: 'NovaWatch Fit',
    category: 'Smartwatches',
    description: 'Sleek fitness tracker with continuous heart rate monitoring and GPS.',
    price: 199.50,
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&q=80',
    stock: 85,
    rating: 4.5,
    specifications: {
      Display: '1.2" AMOLED',
      Sensors: 'HR, SpO2, GPS',
      Battery: 'Up to 7 days',
      WaterResistance: '5ATM'
    }
  },
  {
    id: 'p5',
    name: 'UltraView 34" Monitor',
    category: 'Monitors',
    description: 'Ultrawide curved gaming monitor with 144Hz refresh rate and 1ms response time.',
    price: 499.00,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80',
    stock: 22,
    rating: 4.7,
    specifications: {
      Size: '34" Curved',
      Resolution: '3440 x 1440',
      RefreshRate: '144Hz',
      PanelType: 'VA'
    }
  },
  {
    id: 'p6',
    name: 'ProCharge PowerBank',
    category: 'Accessories',
    description: 'Fast-charging 20,000mAh portable charger with USB-C PD output.',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500&q=80',
    stock: 200,
    rating: 4.4,
    specifications: {
      Capacity: '20,000mAh',
      Ports: '2x USB-A, 1x USB-C',
      Output: 'up to 65W PD',
      Weight: '350g'
    }
  }
];

export const INITIAL_ORDERS = [
  {
    orderId: 'NM-10001',
    customerId: 'CUST-1',
    customerName: 'Test Customer',
    items: [
      {
        productId: 'p4',
        productName: 'NovaWatch Fit',
        quantity: 1,
        unitPrice: 199.50,
        totalPrice: 199.50
      }
    ],
    totalAmount: 199.50,
    orderDate: '2026-09-20 14:20:00',
    status: 'DELIVERED',
    confirmation: { status: 'APPROVED', approvedBy: 'admin', approvedAt: '2026-09-20 14:30:00' },
    processing: { startedAt: '2026-09-20 15:00:00', approvedBy: 'admin' },
    shipping: { carrier: 'BlueDart', trackingNumber: 'BD-10001099', shippedAt: '2026-09-21 09:00:00' },
    delivery: { 
      estimatedDate: '2026-09-24', 
      outForDeliveryAt: '2026-09-24 10:00:00', 
      deliveredAt: '2026-09-24 16:45:00' 
    },
    cancellation: { requested: false, requestedAt: null, reason: null, status: null, processedBy: null, processedAt: null },
    return: { 
      requested: true, 
      requestedAt: '2026-09-28 11:00:00', 
      reason: 'Screen flickering issue', 
      resolution: 'REFUND', 
      status: 'PENDING', 
      processedBy: null, 
      processedAt: null 
    },
    refund: { status: 'PENDING', amount: 199.50, processedAt: null, processedBy: null },
    replacement: { requested: false, status: null, processedAt: null, processedBy: null },
    trackingEvents: [
      { date: '2026-09-20 14:20:00', event: 'Order placed' },
      { date: '2026-09-20 14:30:00', event: 'Order confirmed by Admin' },
      { date: '2026-09-21 09:00:00', event: 'Package shipped via BlueDart (Tracking # BD-10001099)' },
      { date: '2026-09-24 16:45:00', event: 'Delivered to recipient' },
      { date: '2026-09-28 11:00:00', event: 'Return requested (Reason: Screen flickering issue, Resolution: REFUND, Status: PENDING)' }
    ]
  },
  {
    orderId: 'NM-8472',
    customerId: 'CUST-1',
    customerName: 'Test Customer',
    items: [
      {
        productId: 'p2',
        productName: 'NovaBook Pro 15',
        quantity: 1,
        unitPrice: 1499.00,
        totalPrice: 1499.00
      }
    ],
    totalAmount: 1499.00,
    orderDate: '2026-09-26 10:30:00',
    status: 'SHIPPED',
    confirmation: { status: 'APPROVED', approvedBy: 'admin', approvedAt: '2026-09-26 10:45:00' },
    processing: { startedAt: '2026-09-26 11:15:00', approvedBy: 'admin' },
    shipping: { carrier: 'FedEx', trackingNumber: 'FX-84729102', shippedAt: '2026-09-27 08:30:00' },
    delivery: { 
      estimatedDate: '2026-09-30', 
      outForDeliveryAt: null, 
      deliveredAt: null 
    },
    cancellation: { requested: false, requestedAt: null, reason: null, status: null, processedBy: null, processedAt: null },
    return: { requested: false, requestedAt: null, reason: null, resolution: null, status: null, processedBy: null, processedAt: null },
    refund: { status: null, amount: null, processedAt: null, processedBy: null },
    replacement: { requested: false, status: null, processedAt: null, processedBy: null },
    trackingEvents: [
      { date: '2026-09-26 10:30:00', event: 'Order placed' },
      { date: '2026-09-26 10:45:00', event: 'Order confirmed by Admin' },
      { date: '2026-09-26 11:15:00', event: 'Order processing in warehouse' },
      { date: '2026-09-27 08:30:00', event: 'Package shipped via FedEx (Tracking # FX-84729102)' }
    ]
  }
];

