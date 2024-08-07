import { Order } from "../models/order.model.js"
import { User } from "../models/user.model.js"


//placing user order for frontend
const placeOrder = async (req, res) => {

    const frontend_url = "http://localhost:5173"

    try {
        const { userId, items, amount, address } = req.body

        const newOrder = await Order.create({
            userId,
            items,
            amount,
            address
        })

        //clean users cart data
        await User.findByIdAndUpdate(
            userId,
            { cartData: {} }
        )

        const line_items = items.map((item) => ({
            price_data: {
                currency: "inr",
                product_data: {
                    name: item.name
                },
                unit_amount: item.price * 100 * 80
            },
            quantity: item.quantity
        }))

        //delivery charges
        line_items.push({
            price_data: {
                currency: "inr",
                product_data: {
                    name: "Delivery Charges"
                }
            },
            quantity: 1
        })

        const session = await Stripe.checkout.sessions.create({
            line_items,
            mode: 'payment',
            success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`
        })

        return res.json({ success: true, session_url: session.url })


    } catch (error) {
        console.log("Cannot Process the payment");
        res.json({ success: false, message: "Cannot Process the payment" })
    }
}

const verifyOrder = async (req, res) => {
    const { orderId, success } = req.body;
    try {
        if (success === "true") {
            await Order.findByIdAndUpdate(
                orderId,
                { payment: true }
            )
            res.json({ success: true, message: "Paid" })
        }
        else {
            await Order.findByIdAndDelete(orderId)
            res.json({ success: false, message: "Not Paid" })
        }
    } catch (error) {

        console.log("Error while payment");
        res.json({success: false, message: "Error while payment"})
    }
}

export { placeOrder, verifyOrder }