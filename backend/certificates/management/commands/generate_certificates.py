"""
Django management command to generate certificates for an event.
Usage: python manage.py generate_certificates --event_id=1
"""
from django.core.management.base import BaseCommand
from certificates.generator import generate_certificates_for_event


class Command(BaseCommand):
    help = 'Generate certificates for eligible participants of an event'

    def add_arguments(self, parser):
        parser.add_argument(
            '--event_id',
            type=int,
            help='ID of the event to generate certificates for',
            required=True
        )

    def handle(self, *args, **options):
        event_id = options['event_id']
        success = generate_certificates_for_event(event_id)
        
        if success:
            self.stdout.write(
                self.style.SUCCESS('Successfully generated certificates')
            )
        else:
            self.stdout.write(
                self.style.ERROR('Failed to generate certificates')
            )
