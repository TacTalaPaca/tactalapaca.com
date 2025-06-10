const savedLanguage = localStorage.getItem('language') || 'english';

const applyLanguagePreferenceInstant = (language) => {
  document.documentElement.classList.remove('english', 'romanian');
  document.documentElement.classList.add(language);

  const existingStyle = document.getElementById('instant-language-style');
  if (existingStyle) existingStyle.remove();

  const style = document.createElement('style');
  style.id = 'instant-language-style';
  style.textContent = language === 'romanian' ? '.eng { display: none !important; } .rom { display: block !important; }' : '.eng { display: block !important; } .rom { display: none !important; }';

  document.head.appendChild(style);
};

const applyLanguagePreference = (language) => {
  document.querySelectorAll('.eng').forEach((el) => (el.style.display = language === 'romanian' ? 'none' : 'block'));
  document.querySelectorAll('.rom').forEach((el) => (el.style.display = language === 'romanian' ? 'block' : 'none'));
};

const toggleLanguage = () => {
  const currentLanguage = document.documentElement.classList.contains('romanian') ? 'romanian' : 'english';
  const newLanguage = currentLanguage === 'romanian' ? 'english' : 'romanian';
  localStorage.setItem('language', newLanguage);
  applyLanguagePreferenceInstant(newLanguage);
  applyLanguagePreference(newLanguage);
};

const initializeLanguage = () => {
  const btn = document.querySelector('.language');
  if (!btn) return setTimeout(initializeLanguage, 100);
  btn.onclick = (e) => (e.preventDefault(), toggleLanguage());
};

applyLanguagePreferenceInstant(savedLanguage);

document.addEventListener('DOMContentLoaded', () => (applyLanguagePreference(savedLanguage), initializeLanguage()));
document.addEventListener('component:loaded', (e) => e.detail.component === 'navbar' && initializeLanguage());
