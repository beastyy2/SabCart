import { inngest } from "@/config/inngest";
import Product from "@/models/product";
import User from "@/models/user"; // ✅ Tambahkan ini
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        const { address, items } = await request.json();

        if (!address || items.length === 0) {
            return NextResponse.json({ success: false, message: 'Invalid Data' });
        }

        const amount = await items.reduce(async (accPromise, item) => {
            const acc = await accPromise;
            const product = await Product.findById(item.product);
            return await acc + product.offerPrice * item.quantity;
        }, Promise.resolve(0)); // ✅ fix reduce with async

        await inngest.send({
            name: 'order/created',
            data: {
                userId,
                address,
                items,
                amount: amount + Math.floor(amount * 0.02),
                date: Date.now()
            }
        });

        // ✅ Clear user cart
        const userData = await User.findById(userId);
        userData.cartItems = {};
        await userData.save();

        return NextResponse.json({ success: true, message: 'Order Placed' });

    } catch (error) {
        console.log(error);
        return NextResponse.json({ success: false, message: error.message });
    }
}