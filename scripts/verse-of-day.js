document.addEventListener('DOMContentLoaded', async function () {
  const verseLoading = document.getElementById('verseLoading');
  const verseError = document.getElementById('verseError');
  const verseText = document.getElementById('verseText');
  const verseReference = document.getElementById('verseReference');

  try {
    const response = await fetch('https://beta.ourmanna.com/api/v1/get?format=json&order=daily', {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.verse && data.verse.details && data.verse.details.text) {
        verseText.textContent = `"${data.verse.details.text.trim()}"`;
        verseReference.textContent = `${data.verse.details.reference} (${data.verse.details.version})`;

        verseLoading.style.display = 'none';
        verseText.style.display = 'block';
        verseReference.style.display = 'block';
        return;
      }
    }

    throw new Error('API failed');
  } catch (error) {
    console.log('Failed to fetch verse of the day');

    verseLoading.style.display = 'none';
    verseError.style.display = 'block';
  }
});
