import razorpay
import os

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_key")
RAZORPAY_SECRET = os.getenv("RAZORPAY_SECRET", "test_secret")

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_SECRET))

class PaymentService:
    @staticmethod
    def create_order(amount: float, currency: str = "INR") -> dict:
        """Create a Razorpay order for the booking."""
        data = {
            "amount": int(amount * 100), # Amount in paise
            "currency": currency,
            "payment_capture": 1 # Auto capture
        }
        return client.order.create(data=data)

    @staticmethod
    def verify_payment(payment_id: str, order_id: str, signature: str) -> bool:
        """Verify the payment signature for security."""
        params_dict = {
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature
        }
        try:
            client.utility.verify_payment_signature(params_dict)
            return True
        except Exception:
            return False
