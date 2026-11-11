const { z } = require('zod');

// Warehouse Validation
const createWarehouse = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    location: z.string().optional(),
    capacity: z.number().int().positive().optional(),
    manager_name: z.string().optional(),
    contact_number: z.string().optional(),
    is_active: z.boolean().default(true)
});

// Order Validation
const createOrder = z.object({
    customer_id: z.number().int().positive(),
    shipping_address: z.string().optional(),
    billing_address: z.string().optional(),
    notes: z.string().optional(),
    due_date: z.string().optional(),
    delivery_date: z.string().optional(),
    items: z.array(z.object({
        product_id: z.number().int().positive(),
        quantity: z.number().positive(),
        unit_price: z.number().positive(),
        discount: z.number().min(0).optional(),
        line_total: z.number().min(0).optional(),
        notes: z.string().optional(),
        remark: z.string().optional()
    })).min(1, 'At least one item is required')
});

// Invoice Validation
const createInvoice = z.object({
    order_id: z.number().int().positive(),
    due_date: z.string().optional() // YYYY-MM-DD
});

// Payment Validation
const createPayment = z.object({
    order_id: z.number().int().positive(),
    invoice_id: z.number().int().positive().optional(),
    amount: z.number(), // Allow negative for refunds
    payment_method: z.string().min(1),
    reference_number: z.string().optional(),
    wastage: z.number().min(0).optional()
});

// Delivery Validation
const createDelivery = z.object({
    delivery_date: z.string().optional(),
    delivery_address: z.string().optional(),
    delivery_person_name: z.string().optional(),
    delivery_person_phone: z.string().optional(),
    tracking_number: z.string().optional(),
    status: z.enum(['pending', 'confirmed', 'in_transit', 'delivered', 'cancelled', 'failed', 'returned']).default('delivered'),
    notes: z.string().optional()
});

const updateInvoiceStatus = z.object({
    status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled'], {
        required_error: "Status is required",
        invalid_type_error: "Status must be one of: draft, sent, paid, overdue, cancelled"
    })
});

// Sales Route Validation
const createSalesRoute = z.object({
    route_name: z.string().min(1, 'Route name is required').optional(), // snake_case
    routeName: z.string().min(1, 'Route name is required').optional(), // camelCase
    description: z.string().optional(),
    assigned_sales_rep_id: z.number().int().optional(),
    start_location: z.string().optional(),
    end_location: z.string().optional(),
    is_active: z.boolean().default(true),

    // New fields
    zoom_level: z.number().int().optional(),
    zoomLevel: z.number().int().optional(),

    country: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),

    postal_code: z.string().optional(),
    postalCode: z.string().optional(),

    center_lat: z.number().optional(),
    centerLat: z.number().optional(),

    center_lng: z.number().optional(),
    centerLng: z.number().optional(),

    coverage_radius: z.number().optional(),
    coverageRadius: z.number().optional(),

    end_lat: z.number().optional(),
    endLat: z.number().optional(),

    end_lng: z.number().optional(),
    endLng: z.number().optional(),

    end_city: z.string().optional(),
    endCity: z.string().optional(),

    end_state: z.string().optional(),
    endState: z.string().optional(),

    end_country: z.string().optional(),
    endCountry: z.string().optional(),

    end_postal_code: z.string().optional(),
    endPostalCode: z.string().optional()
}).refine(data => data.route_name || data.routeName, {
    message: "Route name is required",
    path: ["routeName"]
});

module.exports = {
    createWarehouse,
    createOrder,
    createInvoice,
    createPayment,
    createDelivery,
    updateInvoiceStatus,
    createSalesRoute
};
