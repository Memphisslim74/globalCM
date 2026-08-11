const forms = document.querySelectorAll('[data-contact-form]');

forms.forEach((form) => {
  const status = form.querySelector('[data-form-status]');
  const button = form.querySelector('button[type="submit"]');
  if (!status || !button) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      status.textContent = 'Please complete the required fields.';
      status.className = 'form-status is-error';
      return;
    }

    button.disabled = true;
    status.textContent = 'Sending your message…';
    status.className = 'form-status';

    const payload = Object.fromEntries(new FormData(form).entries());
    payload.source_page = window.location.pathname;

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message || 'Unable to send your message.');
      sessionStorage.setItem('gcomLeadSubmitted', JSON.stringify({ sourcePage: payload.source_page, confirmationSent: result.confirmationSent !== false }));
      window.location.assign('/thank-you');
    } catch (error) {
      status.textContent = error.message || 'Unable to send your message. Please email connect@gcom.world.';
      status.className = 'form-status is-error';
      button.disabled = false;
    }
  });
});
