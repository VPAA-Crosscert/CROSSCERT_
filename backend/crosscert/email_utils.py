"""
Email helper utilities for CROSSCERT.
Uses Django's email backend and centralized templates.
"""
from django.core.mail import send_mail
from django.conf import settings
from typing import Optional


SENDER_EMAIL = getattr(settings, "DEFAULT_FROM_EMAIL", "crosscert.dvo@gmail.com")


def _send(subject: str, body: str, to_email: str) -> None:
  if not to_email:
      return
  send_mail(
      subject=subject,
      message=body,
      from_email=SENDER_EMAIL,
      recipient_list=[to_email],
      fail_silently=True,
  )


def send_registration_confirmation(participant_name: str, event_title: str, event_date: str, event_time: str, venue: str, to_email: str) -> None:
    body = f"""Dear {participant_name},

Greetings from the Holy Cross of Davao College!

This is to confirm that your registration for {event_title}, organized by the Office of the Vice President for Academic Affairs (VPAA), has been successfully received.

Please take note of your event details below:
Date: {event_date}
Time: {event_time}
Venue: {venue}

Please keep this information for your reference. You will receive another email for attendance confirmation and, later, a post-event evaluation form.

Thank you for your participation and interest in this event.

Sincerely,
CROSSCERT Team
Holy Cross of Davao College
"""
    _send(f"Registration Confirmation – {event_title}", body, to_email)


def send_attendance_confirmation(participant_name: str, event_title: str, event_date: str, venue: str, to_email: str) -> None:
    body = f"""Dear {participant_name},

This email confirms your successful attendance for {event_title} held on {event_date} at {venue}.

We appreciate your active participation in this event.
Your attendance has been officially recorded in our system.

You will soon receive a follow-up email containing the Post-Event Evaluation Form.
Please complete it to receive your official certificate of participation.

Thank you and congratulations for being part of this learning experience!

Warm regards,
CROSSCERT Team
Holy Cross of Davao College
"""
    _send(f"Attendance Confirmation – {event_title}", body, to_email)


def send_post_event_evaluation_email(participant_name: str, event_title: str, evaluation_url: str, to_email: str) -> None:
    body = f"""Dear {participant_name},

Thank you for attending {event_title} organized by the Holy Cross of Davao College.

We value your feedback to help us improve future events.
Please take a few moments to answer the post-event evaluation form below:

Evaluation Link: {evaluation_url}

After submitting your evaluation, your Certificate of Participation will be automatically generated and sent to your registered email address.

We truly appreciate your time and support.

Best regards,
CROSSCERT Team
Holy Cross of Davao College
"""
    _send(f"Post-Event Evaluation – {event_title}", body, to_email)


def send_event_created_notification(event_title: str, event_date: str, organizer_email: Optional[str]) -> None:
    """Notify organizer (or admin) when a new event is created."""
    if not organizer_email:
        return
    body = f"""Dear Organizer,

Your event "{event_title}" has been created in CROSSCERT for {event_date}.

You can now share the event registration QR code, manage participants, and track attendance through the admin dashboard.

Best regards,
CROSSCERT Team
"""
    _send(f"New Event Created – {event_title}", body, organizer_email)


