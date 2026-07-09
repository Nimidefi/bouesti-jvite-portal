import os
import stripe
from fastapi import APIRouter, HTTPException, Request, Header, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import SubmissionModel

router = APIRouter(
    prefix="/api/payments",
    tags=["payments"]
)

# Use test mode key from environment variable, fallback to a dummy if not set
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_placeholder")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")

class PaymentIntentRequest(BaseModel):
    amount: int
    currency: str = "usd"
    description: str = None
    submissionId: str

class PaymentIntentResponse(BaseModel):
    clientSecret: str

@router.post("/create-intent", response_model=PaymentIntentResponse)
def create_payment_intent(req: PaymentIntentRequest):
    try:
        # Amount in cents
        amount_cents = req.amount * 100
        
        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency=req.currency,
            description=req.description,
            metadata={"submissionId": req.submissionId}
        )
        return PaymentIntentResponse(clientSecret=intent.client_secret)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None), db: Session = Depends(get_db)):
    payload = await request.body()
    try:
        if STRIPE_WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(
                payload, stripe_signature, STRIPE_WEBHOOK_SECRET
            )
        else:
            event = stripe.Event.construct_from(
                stripe.util.json.loads(payload), stripe.api_key
            )
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "payment_intent.succeeded":
        payment_intent = event["data"]["object"]
        submission_id = payment_intent.get("metadata", {}).get("submissionId")
        if submission_id:
            sub = db.query(SubmissionModel).filter(SubmissionModel.id == submission_id).first()
            if sub and sub.status == "submitted":
                sub.status = "under-review"
                db.commit()

    return {"status": "success"}
