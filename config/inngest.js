import { inngest } from "@/config/inngest";
import Product from "@/models/product";
import User from "@/models/user"; // WAJIB: tambahkan import User
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        const { address, items } = await request.json();

        // Validasi input
        if (!address || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ success: false, message: 'Invalid Data' });
        }

        // Hitung total amount
        const amounts = await Promise.all(
            items.map(async (item) => {
                const product = await Product.findById(item.product);
                if (!product) throw new Error(`Product with ID ${item.product} not found`);
                return product.offerPrice * item.quantity;
            })
        );
        const amount = amounts.reduce((a, b) => a + b, 0);

        // Kirim event ke Inngest
        await inngest.send({
            name: 'order/created',
            data: {
                userId,
                address,
                items,
                amount: amount + Math.floor(amount * 0.02), // tambah 2%
                date: Date.now()
            }
        });

        // Clear user cart
        const user = await User.findById(userId);
        if (user) {
            user.cartItems = []; // Kosongkan array cart
            await user.save();
        }

        return NextResponse.json({ success: true, message: 'Order Placed' });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, message: error.message });
    }
}
