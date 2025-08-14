import { inngest } from "@/config/inngest";
import Product from "@/models/product";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        
        const {userId} = getAuth(request)
        const { address, items } = await request.json();

        if (!address || items.length === 0) {
            return NextResponse.json({ success: false, message: 'Invalid Data'});
        }

        //calculate ammount using items
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

        // clear user cart
        const user = await User.findById(userId)
        user.cartItems = {}
        await user.save()

        return NextResponse.json({ success: true, message: 'Order Placed' })

    } catch (error) {
        console.log(error)
         return NextResponse.json({ success: false, message: error.message })
    }
    
}