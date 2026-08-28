/* ==========================================================
   email/config.js
   Configuración del formulario de contacto — El Bodegón de los Trajes
   ==========================================================
   INSTRUCCIONES:
   1. Ve a https://formspree.io y crea una cuenta gratuita
   2. Crea un nuevo formulario con el correo avimateo2@gmail.com
   3. Copia el ID del formulario (la parte final de la URL)
      Ejemplo: si tu URL es https://formspree.io/f/mwkgpkwn
      el ID es "mwkgpkwn"
   4. Reemplaza "TU_FORMSPREE_ID_AQUI" con tu ID real
   ========================================================== */

window.EMAIL_CONFIG = {
  // ID de Formspree — reemplazar con el tuyo
  formspreeId: 'xppabela',

  // Dirección de destino (solo referencia, Formspree usa la configurada en su panel)
  recipient: 'avimateo2@gmail.com',

  // Nombre del negocio
  businessName: 'El Bodegón de los Trajes',

  // Número de WhatsApp (fallback si el usuario prefiere WhatsApp)
  whatsappNumber: '573107706615',

  // Mensajes de feedback
  messages: {
    sending: 'Enviando tu mensaje...',
    success: '¡Mensaje enviado! Te contactaremos pronto a tu correo.',
    error: 'Hubo un error al enviar. Intenta de nuevo o escríbenos por WhatsApp.',
    validation: 'Por favor completa todos los campos correctamente.'
  }
};
