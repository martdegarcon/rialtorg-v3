const menuButton = document.querySelector('.nav__toggle');
const menu = document.querySelector('.nav__items');

menuButton?.addEventListener('click', () => {
  const isOpen = menu.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
});

menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  menu.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
}));

document.querySelectorAll('.accordion article').forEach((item) => {
  item.querySelector('button')?.addEventListener('click', () => item.classList.toggle('open'));
});

document.querySelector('.request-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button');
  button.firstChild.textContent = 'Заявка отправлена ';
  setTimeout(() => { button.firstChild.textContent = 'Отправить '; }, 2400);
});
