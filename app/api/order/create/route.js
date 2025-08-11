import { inngest } from "@/config/inngest";
import Product from "@/models/product";
import User from "@/models/user";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        // Ambil userId dari Clerk
        const { userId } = getAuth(request);
        const { address, items } = await request.json();

        // Validasi data
        if (!address || !items || items.length === 0) {
            return NextResponse.json({
                success: false,
                message: "Invalid data"
            });
        }

        // Hitung total amount
        let amount = 0;
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return NextResponse.json({
                    success: false,
                    message: `Product with ID ${item.product} not found`
                });
            }
            amount += product.offerPrice * item.quantity;
        }

        // Kirim event order ke Inngest
        await inngest.send({
            name: "order/created",
            data: {
                userId,
                address,
                items,
                amount: amount + Math.floor(amount * 0.02), // plus 2% fee
                date: Date.now()
            }
        });

        // Bersihkan cart user
        const user = await User.findById(userId);
        if (user) {
            user.cartItems = {};
            await user.save();
        }

        return NextResponse.json({
            success: true,
            message: "Order Placed"
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({
            success: false,
            message: error.message || "Something went wrong"
        });
    }
}
