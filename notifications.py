"""
Módulo de notificaciones para el tracker de Idealista

Este archivo contiene ejemplos de cómo implementar diferentes tipos de notificaciones.
Descomenta y configura el método que prefieras usar.
"""

import os
from datetime import datetime


class NotificationManager:
    """Gestor de notificaciones multi-canal"""
    
    def __init__(self):
        self.enabled_channels = []
        self._setup_channels()
    
    def _setup_channels(self):
        """Configura los canales de notificación disponibles"""
        # Aquí se pueden habilitar diferentes canales
        # self.enabled_channels.append('email')
        # self.enabled_channels.append('telegram')
        # self.enabled_channels.append('slack')
        pass
    
    def send_notification(self, property_data):
        """Envía notificación por todos los canales habilitados"""
        message = self._format_message(property_data)
        
        for channel in self.enabled_channels:
            try:
                if channel == 'email':
                    self._send_email(message, property_data)
                elif channel == 'telegram':
                    self._send_telegram(message, property_data)
                elif channel == 'slack':
                    self._send_slack(message, property_data)
                elif channel == 'console':
                    self._send_console(message)
            except Exception as e:
                print(f"❌ Error enviando notificación por {channel}: {e}")
    
    def _format_message(self, property_data):
        """Formatea el mensaje de notificación"""
        return f"""
🏠 ¡NUEVA PROPIEDAD DISPONIBLE!

📍 Ubicación: {property_data['direccion']}
   {property_data['distrito']}, {property_data['municipio']}

💰 Precio: {property_data['precio']:,.0f}€
📏 Tamaño: {property_data['tamaño']}m²
💵 Precio/m²: {property_data['precio_m2']:.0f}€/m²

🛏️  Habitaciones: {property_data['habitaciones']}
🚿 Baños: {property_data['baños']}
🏢 Planta: {property_data['planta']}

✨ Características:
   • Exterior: {'Sí' if property_data['exterior'] else 'No'}
   • Ascensor: {'Sí' if property_data['ascensor'] else 'No'}
   • Parking: {'Sí' if property_data['parking'] else 'No'}

🔗 Ver más: {property_data['url']}

📅 Detectado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
    
    def _send_console(self, message):
        """Imprime la notificación en consola"""
        print("\n" + "="*60)
        print(message)
        print("="*60 + "\n")
    
    # ============================================================
    # EMAIL - Requiere configurar SMTP
    # ============================================================
    
    def _send_email(self, message, property_data):
        """
        Envía notificación por email
        
        Configuración requerida en .env:
        EMAIL_SMTP_SERVER=smtp.gmail.com
        EMAIL_SMTP_PORT=587
        EMAIL_FROM=tu_email@gmail.com
        EMAIL_PASSWORD=tu_contraseña_de_aplicacion
        EMAIL_TO=destinatario@email.com
        """
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        
        # Configuración
        smtp_server = os.getenv('EMAIL_SMTP_SERVER', 'smtp.gmail.com')
        smtp_port = int(os.getenv('EMAIL_SMTP_PORT', '587'))
        email_from = os.getenv('EMAIL_FROM')
        email_password = os.getenv('EMAIL_PASSWORD')
        email_to = os.getenv('EMAIL_TO')
        
        if not all([email_from, email_password, email_to]):
            print("⚠️  Configuración de email incompleta")
            return
        
        # Crear mensaje
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"🏠 Nueva propiedad: {property_data['precio']:,.0f}€ - {property_data['distrito']}"
        msg['From'] = email_from
        msg['To'] = email_to
        
        # Versión texto
        text_part = MIMEText(message, 'plain', 'utf-8')
        msg.attach(text_part)
        
        # Versión HTML (opcional, más bonita)
        html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>🏠 Nueva Propiedad Disponible</h2>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px;">
                <h3>📍 {property_data['direccion']}</h3>
                <p><strong>Ubicación:</strong> {property_data['distrito']}, {property_data['municipio']}</p>
                
                <hr>
                
                <p><strong>💰 Precio:</strong> {property_data['precio']:,.0f}€</p>
                <p><strong>📏 Tamaño:</strong> {property_data['tamaño']}m²</p>
                <p><strong>💵 Precio/m²:</strong> {property_data['precio_m2']:.0f}€/m²</p>
                
                <hr>
                
                <p><strong>🛏️ Habitaciones:</strong> {property_data['habitaciones']}</p>
                <p><strong>🚿 Baños:</strong> {property_data['baños']}</p>
                <p><strong>🏢 Planta:</strong> {property_data['planta']}</p>
                
                <hr>
                
                <h4>✨ Características:</h4>
                <ul>
                    <li>Exterior: {'Sí' if property_data['exterior'] else 'No'}</li>
                    <li>Ascensor: {'Sí' if property_data['ascensor'] else 'No'}</li>
                    <li>Parking: {'Sí' if property_data['parking'] else 'No'}</li>
                </ul>
                
                <p style="margin-top: 20px;">
                    <a href="{property_data['url']}" 
                       style="background-color: #4CAF50; color: white; padding: 10px 20px; 
                              text-decoration: none; border-radius: 5px;">
                        Ver Propiedad en Idealista
                    </a>
                </p>
                
                {'<img src="' + property_data['thumbnail'] + '" style="max-width: 100%; margin-top: 20px;">' if property_data.get('thumbnail') else ''}
            </div>
        </body>
        </html>
        """
        html_part = MIMEText(html_message, 'html', 'utf-8')
        msg.attach(html_part)
        
        # Enviar
        try:
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(email_from, email_password)
                server.send_message(msg)
            print(f"✅ Email enviado a {email_to}")
        except Exception as e:
            print(f"❌ Error enviando email: {e}")
    
    # ============================================================
    # TELEGRAM - Requiere crear un bot
    # ============================================================
    
    def _send_telegram(self, message, property_data):
        """
        Envía notificación por Telegram
        
        Configuración requerida en .env:
        TELEGRAM_BOT_TOKEN=tu_bot_token
        TELEGRAM_CHAT_ID=tu_chat_id
        
        Para obtener un bot token:
        1. Habla con @BotFather en Telegram
        2. Envía /newbot y sigue las instrucciones
        3. Guarda el token que te da
        
        Para obtener tu chat_id:
        1. Habla con @userinfobot en Telegram
        2. Te dirá tu chat_id
        """
        import requests
        
        bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        chat_id = os.getenv('TELEGRAM_CHAT_ID')
        
        if not all([bot_token, chat_id]):
            print("⚠️  Configuración de Telegram incompleta")
            return
        
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        
        # Formatear mensaje para Telegram (Markdown)
        telegram_message = f"""
🏠 *NUEVA PROPIEDAD DISPONIBLE*

📍 *Ubicación:* {property_data['direccion']}
{property_data['distrito']}, {property_data['municipio']}

💰 *Precio:* {property_data['precio']:,.0f}€
📏 *Tamaño:* {property_data['tamaño']}m²
💵 *Precio/m²:* {property_data['precio_m2']:.0f}€/m²

🛏️ *Habitaciones:* {property_data['habitaciones']}
🚿 *Baños:* {property_data['baños']}
🏢 *Planta:* {property_data['planta']}

✨ *Características:*
• Exterior: {'Sí' if property_data['exterior'] else 'No'}
• Ascensor: {'Sí' if property_data['ascensor'] else 'No'}
• Parking: {'Sí' if property_data['parking'] else 'No'}

🔗 [Ver en Idealista]({property_data['url']})
"""
        
        payload = {
            'chat_id': chat_id,
            'text': telegram_message,
            'parse_mode': 'Markdown',
            'disable_web_page_preview': False
        }
        
        try:
            response = requests.post(url, json=payload)
            response.raise_for_status()
            print(f"✅ Mensaje de Telegram enviado")
            
            # Enviar imagen si está disponible
            if property_data.get('thumbnail'):
                self._send_telegram_photo(bot_token, chat_id, property_data['thumbnail'])
                
        except Exception as e:
            print(f"❌ Error enviando mensaje de Telegram: {e}")
    
    def _send_telegram_photo(self, bot_token, chat_id, photo_url):
        """Envía una foto por Telegram"""
        import requests
        
        url = f"https://api.telegram.org/bot{bot_token}/sendPhoto"
        payload = {
            'chat_id': chat_id,
            'photo': photo_url
        }
        
        try:
            requests.post(url, json=payload)
        except Exception as e:
            print(f"⚠️  Error enviando foto de Telegram: {e}")
    
    # ============================================================
    # SLACK - Requiere crear una app de Slack
    # ============================================================
    
    def _send_slack(self, message, property_data):
        """
        Envía notificación por Slack
        
        Configuración requerida en .env:
        SLACK_WEBHOOK_URL=tu_webhook_url
        
        Para obtener un webhook:
        1. Ve a https://api.slack.com/apps
        2. Crea una nueva app
        3. Activa "Incoming Webhooks"
        4. Crea un nuevo webhook para tu workspace
        5. Copia la URL del webhook
        """
        import requests
        
        webhook_url = os.getenv('SLACK_WEBHOOK_URL')
        
        if not webhook_url:
            print("⚠️  Configuración de Slack incompleta")
            return
        
        # Formatear mensaje para Slack
        slack_message = {
            "text": "🏠 Nueva propiedad disponible en Idealista",
            "blocks": [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": "🏠 Nueva Propiedad Disponible"
                    }
                },
                {
                    "type": "section",
                    "fields": [
                        {
                            "type": "mrkdwn",
                            "text": f"*Precio:*\n{property_data['precio']:,.0f}€"
                        },
                        {
                            "type": "mrkdwn",
                            "text": f"*Tamaño:*\n{property_data['tamaño']}m²"
                        },
                        {
                            "type": "mrkdwn",
                            "text": f"*Habitaciones:*\n{property_data['habitaciones']}"
                        },
                        {
                            "type": "mrkdwn",
                            "text": f"*Baños:*\n{property_data['baños']}"
                        }
                    ]
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*📍 Ubicación:*\n{property_data['direccion']}\n{property_data['distrito']}, {property_data['municipio']}"
                    }
                },
                {
                    "type": "actions",
                    "elements": [
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": "Ver en Idealista"
                            },
                            "url": property_data['url'],
                            "style": "primary"
                        }
                    ]
                }
            ]
        }
        
        # Añadir imagen si está disponible
        if property_data.get('thumbnail'):
            slack_message["blocks"].insert(1, {
                "type": "image",
                "image_url": property_data['thumbnail'],
                "alt_text": property_data['titulo']
            })
        
        try:
            response = requests.post(webhook_url, json=slack_message)
            response.raise_for_status()
            print(f"✅ Mensaje de Slack enviado")
        except Exception as e:
            print(f"❌ Error enviando mensaje de Slack: {e}")


# ============================================================
# EJEMPLO DE USO
# ============================================================

if __name__ == '__main__':
    # Datos de ejemplo
    test_property = {
        'id': '12345',
        'titulo': 'Piso en venta en Madrid',
        'precio': 250000,
        'tamaño': 80,
        'precio_m2': 3125,
        'habitaciones': 3,
        'baños': 2,
        'planta': '3',
        'exterior': True,
        'ascensor': True,
        'parking': False,
        'direccion': 'Calle Mayor 10',
        'distrito': 'Centro',
        'municipio': 'Madrid',
        'provincia': 'Madrid',
        'url': 'https://www.idealista.com/inmueble/12345/',
        'thumbnail': 'https://img3.idealista.com/blur/WEB_LISTING/0/id.pro.es.image.master/12/34/56.jpg',
        'descripcion': 'Bonito piso en el centro de Madrid'
    }
    
    # Crear gestor de notificaciones
    notifier = NotificationManager()
    
    # Habilitar consola para prueba
    notifier.enabled_channels.append('console')
    
    # Enviar notificación de prueba
    notifier.send_notification(test_property)
    
    print("\n💡 Para habilitar otros canales:")
    print("   1. Configura las variables en .env")
    print("   2. Descomenta el canal en _setup_channels()")
    print("   3. Importa este módulo en tracker.py")


