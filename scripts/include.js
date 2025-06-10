document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-include]').forEach(async (element) => {
    const file = element.dataset.include;
    try {
      const response = await fetch(file);
      if (!response.ok) throw new Error(`Could not load ${file}`);
      element.innerHTML = await response.text();
      document.dispatchEvent(
        new CustomEvent('component:loaded', {
          detail: {
            component: file.split('/').pop().replace('.html', ''),
            element,
          },
        })
      );
    } catch (error) {
      console.error('Error including file:', error);
      element.innerHTML = `<p>Error loading component: ${file}</p>`;
    }
  });
});
