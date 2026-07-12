import os
import smtplib
import json
import urllib.request
import urllib.error
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from database import SessionLocal
from models import BoardMemberModel, EditorModel

def _log_to_file_and_console(recipient: str, subject: str, body: str):
    """Helper to log email content when SMTP/API keys are not configured."""
    log_path = os.path.join(os.path.dirname(__file__), "email_logs.log")
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = (
        f"[{timestamp}] === SIMULATED EMAIL ===\n"
        f"To: {recipient}\n"
        f"Subject: {subject}\n"
        f"Body:\n{body}\n"
        f"====================================\n\n"
    )
    print(f"\n[EMAIL SIMULATION] To: {recipient} | Subject: {subject}")
    try:
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(log_entry)
    except Exception as e:
        print(f"Could not write to email_logs.log: {e}")

def _send_email(recipient: str, subject: str, html_body: str, text_body: str):
    """Core email sending dispatcher handling Resend API, SendGrid API, or direct SMTP."""
    from dotenv import load_dotenv
    load_dotenv(override=True)

    # 0. Intercept placeholder/demo domains so Gmail SMTP never attempts delivery and triggers Mailer-Daemon bounces
    clean_recipient = recipient.strip().lower()
    if any(clean_recipient.endswith(domain) for domain in ["@journal.com", "@example.com", "@test.com", "@demo.com"]) or "localhost" in clean_recipient:
        print(f"[EMAIL SIMULATION - DEMO ACCOUNT] Intercepted outbound email to {recipient} (placeholder domain). Logging locally without sending SMTP.")
        _log_to_file_and_console(recipient, subject, text_body)
        return

    resend_key = os.getenv("RESEND_API_KEY")
    sendgrid_key = os.getenv("SENDGRID_API_KEY")
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = os.getenv("SMTP_PORT", "587")
    smtp_user = os.getenv("SMTP_USERNAME")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    sender_email = os.getenv("SENDER_EMAIL", os.getenv("SMTP_USERNAME", "noreply@dovitejournal.org"))

    # 1. Try Resend API if key is present
    if resend_key:
        try:
            url = "https://api.resend.com/emails"
            payload = json.dumps({
                "from": sender_email,
                "to": [recipient],
                "subject": subject,
                "html": html_body,
                "text": text_body
            }).encode('utf-8')
            req = urllib.request.Request(url, data=payload, headers={
                "Authorization": f"Bearer {resend_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "Resend/Python 1.0.0 (DoviteJournal)"
            })
            with urllib.request.urlopen(req) as response:
                if response.status in [200, 201, 202]:
                    print(f"Successfully sent email via Resend API to {recipient}")
                    return
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8', errors='ignore')
            print(f"Resend API HTTPError {e.code}: {error_body}. Falling back to SMTP/Log.")
        except Exception as e:
            print(f"Resend API email error: {e}. Falling back to SMTP/Log.")

    # 2. Try Direct SMTP if server is configured
    if smtp_server and smtp_user and smtp_pass:
        try:
            msg = MIMEMultipart('alternative')
            msg['From'] = sender_email
            msg['To'] = recipient
            msg['Subject'] = subject

            msg.attach(MIMEText(text_body, 'plain', 'utf-8'))
            msg.attach(MIMEText(html_body, 'html', 'utf-8'))

            port_num = int(smtp_port) if smtp_port.isdigit() else 587
            try:
                if port_num == 465:
                    server = smtplib.SMTP_SSL(smtp_server, 465, timeout=6)
                else:
                    server = smtplib.SMTP(smtp_server, port_num, timeout=6)
                    if port_num in [587, 25]:
                        server.starttls()
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)
                server.quit()
                print(f"Successfully sent SMTP email to {recipient} on port {port_num}")
                return
            except (TimeoutError, smtplib.SMTPConnectError, OSError) as port_err:
                # Automatic failover between Port 465 and Port 587 if blocked by ISP/router
                failover_port = 587 if port_num == 465 else 465
                print(f"Port {port_num} timed out ({port_err}). Failing over to Port {failover_port}...")
                try:
                    if failover_port == 465:
                        server = smtplib.SMTP_SSL(smtp_server, 465, timeout=6)
                    else:
                        server = smtplib.SMTP(smtp_server, 587, timeout=6)
                        server.starttls()
                    server.login(smtp_user, smtp_pass)
                    server.send_message(msg)
                    server.quit()
                    print(f"Successfully sent SMTP email to {recipient} on failover port {failover_port}")
                    return
                except Exception as failover_err:
                    error_msg = f"SMTP ports 465 & 587 blocked by network ({type(failover_err).__name__}). Add RESEND_API_KEY (Port 443 HTTPS) to bypass ISP/hosting SMTP blocks."
                    print(error_msg)
                    raise TimeoutError(error_msg) from failover_err
        except Exception as e:
            error_msg = f"SMTP email error for {recipient}: {type(e).__name__} - {e}"
            print(error_msg)
            log_path = os.path.join(os.path.dirname(__file__), "email_logs.log")
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            try:
                with open(log_path, "a", encoding="utf-8") as f:
                    f.write(f"[{timestamp}] === SMTP DELIVERY FAILED ===\nTo: {recipient}\nError Details: {error_msg}\n====================================\n\n")
            except Exception:
                pass

    # 3. Fallback to local simulation logging
    _log_to_file_and_console(recipient, subject, text_body)


def send_new_submission_email(submission_id: str, title: str, author_name: str, file_path: str):
    """Notifies the entire editorial board when a new manuscript is uploaded."""
    recipients = set()
    default_editor = os.getenv("EDITOR_EMAIL")
    if default_editor:
        recipients.add(default_editor.strip().lower())
        
    db = SessionLocal()
    try:
        board_members = db.query(BoardMemberModel).all()
        for m in board_members:
            if m.email:
                recipients.add(m.email.strip().lower())
        editors = db.query(EditorModel).all()
        for e in editors:
            if e.email:
                recipients.add(e.email.strip().lower())
    except Exception as e:
        print(f"Could not query board members from database: {e}")
    finally:
        db.close()

    if not recipients:
        fallback = os.getenv("EDITOR_EMAIL", os.getenv("SENDER_EMAIL", "editor@journal.com"))
        recipients.add(fallback.strip().lower())

    subject = f"New Manuscript Submitted: {title[:50]}..."
    
    text_body = f"""Hello Editorial Board Member,

A new manuscript has been submitted to Dovite Journal.

Title: {title}
Author: {author_name}
Submission ID: {submission_id}

Manuscript File URL: {os.getenv('NEXT_PUBLIC_API_URL', 'http://localhost:8000')}{file_path}

Please log in to your Editorial Dashboard to review this submission.

Best regards,
Dovite Journal Editorial Board
"""

    html_body = f"""<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #0f172a; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0; font-size: 20px;">Dovite Journal</h2>
        <p style="margin: 5px 0 0; font-size: 14px; color: #94a3b8;">New Manuscript Submission</p>
    </div>
    <div style="padding: 24px; background-color: #ffffff; color: #334155;">
        <p style="font-size: 16px;">Hello Editorial Board Member,</p>
        <p>A new manuscript has just been submitted to the queue.</p>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; border-left: 4px solid #3b82f6; margin: 20px 0;">
            <p style="margin: 0 0 8px;"><strong>Title:</strong> {title}</p>
            <p style="margin: 0 0 8px;"><strong>Lead Author:</strong> {author_name}</p>
            <p style="margin: 0;"><strong>Submission ID:</strong> <code>{submission_id}</code></p>
        </div>
        <a href="{os.getenv('NEXT_PUBLIC_API_URL', 'http://localhost:8000')}{file_path}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Download Manuscript</a>
    </div>
</div>"""
    
    print(f"Dispatching new submission notification to {len(recipients)} editorial board members: {list(recipients)}")
    for recipient in recipients:
        _send_email(recipient, subject, html_body, text_body)


def send_author_submission_confirmation(submission_id: str, title: str, author_name: str, author_email: str):
    """Notifies the author immediately after their submission is successfully received."""
    subject = f"Submission Received: {title[:50]}... [{submission_id}]"
    
    text_body = f"""Dear {author_name},

Thank you for submitting your manuscript to Dovite Journal. We have successfully received your submission.

Submission Details:
- Title: {title}
- Submission ID: {submission_id}
- Current Status: Submitted (Awaiting Editorial Review)

Our editorial board will review your submission shortly. You will receive an email notification as soon as the status of your manuscript changes or when an editorial decision is made.

If you have any questions, please reply to this email or contact the editorial office citing your Submission ID ({submission_id}).

Best regards,
Editorial Office
Dovite Journal
"""

    html_body = f"""<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #0f172a; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0; font-size: 20px;">Dovite Journal</h2>
        <p style="margin: 5px 0 0; font-size: 14px; color: #94a3b8;">Submission Confirmation</p>
    </div>
    <div style="padding: 24px; background-color: #ffffff; color: #334155;">
        <p style="font-size: 16px;">Dear <strong>{author_name}</strong>,</p>
        <p>Thank you for submitting your research to Dovite Journal. We have successfully received your manuscript and queued it for editorial assessment.</p>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; border-left: 4px solid #10b981; margin: 20px 0;">
            <p style="margin: 0 0 8px;"><strong>Manuscript Title:</strong> {title}</p>
            <p style="margin: 0 0 8px;"><strong>Submission ID:</strong> <code>{submission_id}</code></p>
            <p style="margin: 0;"><strong>Current Status:</strong> <span style="background-color: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">Submitted</span></p>
        </div>
        <p>You will automatically receive status update notifications via email as your manuscript progresses through review.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">Dovite Journal Editorial Office &bull; <a href="https://dovitejournal.org" style="color: #2563eb;">dovitejournal.org</a></p>
    </div>
</div>"""

    _send_email(author_email, subject, html_body, text_body)


def send_submission_status_update(submission_id: str, title: str, author_name: str, author_email: str, new_status: str, feedback: str = None):
    """Sends status change notification (Under Review, Accepted, Rejected) to the author."""
    status_display = {
        "under-review": "Under Review",
        "accepted": "Accepted for Publication 🎉",
        "rejected": "Editorial Decision: Rejected",
        "published": "Published Online 🚀"
    }.get(new_status, new_status.title())

    status_color = {
        "under-review": "#f59e0b",
        "accepted": "#10b981",
        "rejected": "#ef4444",
        "published": "#3b82f6"
    }.get(new_status, "#64748b")

    subject = f"Manuscript Status Update [{submission_id}]: {status_display}"

    feedback_text = f"\nEditorial Feedback/Comments:\n{feedback}\n" if feedback else ""
    feedback_html = f'<div style="background-color: #f1f5f9; padding: 14px; border-radius: 6px; margin: 16px 0;"><p style="margin: 0 0 6px; font-weight: bold;">Editorial Comments:</p><p style="margin: 0; font-style: italic;">{feedback}</p></div>' if feedback else ""

    text_body = f"""Dear {author_name},

We are writing to inform you of a status update regarding your manuscript submitted to Dovite Journal.

Manuscript Title: {title}
Submission ID: {submission_id}
New Status: {status_display}
{feedback_text}
If your manuscript has been accepted, our publishing team will follow up with publication proofs and any applicable processing details.

Best regards,
Editorial Office
Dovite Journal
"""

    html_body = f"""<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #0f172a; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0; font-size: 20px;">Dovite Journal</h2>
        <p style="margin: 5px 0 0; font-size: 14px; color: #94a3b8;">Manuscript Status Notification</p>
    </div>
    <div style="padding: 24px; background-color: #ffffff; color: #334155;">
        <p style="font-size: 16px;">Dear <strong>{author_name}</strong>,</p>
        <p>The status of your manuscript has been updated by the editorial board:</p>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; border-left: 4px solid {status_color}; margin: 20px 0;">
            <p style="margin: 0 0 8px;"><strong>Title:</strong> {title}</p>
            <p style="margin: 0 0 8px;"><strong>Submission ID:</strong> <code>{submission_id}</code></p>
            <p style="margin: 0;"><strong>New Status:</strong> <span style="background-color: {status_color}20; color: {status_color}; padding: 4px 10px; border-radius: 4px; font-weight: bold;">{status_display}</span></p>
        </div>
        {feedback_html}
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">Dovite Journal Editorial Office &bull; <a href="https://dovitejournal.org" style="color: #2563eb;">dovitejournal.org</a></p>
    </div>
</div>"""

    _send_email(author_email, subject, html_body, text_body)


def send_otp_email(recipient_email: str, otp_code: str, purpose: str = "Verification"):
    """Sends a 6-digit OTP verification code via email."""
    subject = f"Your Dovite Journal Verification Code: {otp_code}"

    text_body = f"""Hello,

Your verification code for Dovite Journal ({purpose}) is:

{otp_code}

This code will expire in 10 minutes. If you did not request this code, please ignore this email.

Best regards,
Dovite Journal Security Team
"""

    html_body = f"""<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #0f172a; color: white; padding: 16px; text-align: center;">
        <h3 style="margin: 0; font-size: 18px;">Dovite Journal</h3>
        <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">Security &amp; {purpose}</p>
    </div>
    <div style="padding: 24px; text-align: center; background-color: #ffffff; color: #334155;">
        <p style="font-size: 15px; margin-bottom: 20px;">Use the following 6-digit verification code to complete your request:</p>
        <div style="background-color: #f1f5f9; padding: 16px 24px; border-radius: 8px; display: inline-block; letter-spacing: 6px; font-size: 28px; font-weight: bold; color: #0f172a; border: 1px dashed #cbd5e1;">
            {otp_code}
        </div>
        <p style="font-size: 13px; color: #64748b; margin-top: 24px;">This code expires in <strong>10 minutes</strong>.<br />Never share this verification code with anyone.</p>
    </div>
</div>"""

    _send_email(recipient_email, subject, html_body, text_body)
