import authSeller from "@/lib/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Product from "@/models/product";

export async function GET(request) {
   try {
    
    const  { userId } = getAuth(request)

    const isSeller = authSeller(userId)

    if(!isSeller){
        return NextResponse.json({ success:false, message: 'Not Autorized'});
    }

    await connectDB()

    const products = await Product.find({})
    return NextResponse.json({ success: true, products })

   } catch (error) {
     return NextResponse.json({ success: false, message: error.message})
   }
}