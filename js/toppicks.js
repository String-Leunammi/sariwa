const table = document.getElementById('table');
const plates = document.querySelectorAll('.plate');
const dishTitle = document.getElementById('dishTitle');
const dishInfoCard = document.getElementById('dishInfoCard');
const dishDesc = document.getElementById('dishDesc');

const feedbackCard = document.getElementById('feedbackCard');
const feedbackTitle = document.getElementById('feedbackTitle');
const feedbackText = document.getElementById('feedbackText');
const feedbackUser = document.getElementById('feedbackUser');

let currentRotation = 0;
const totalPlates = 4;
const rotationStep = 360 / totalPlates; 

function updatePlates() {
  const steps = Math.round(currentRotation / rotationStep);
  const topIndex = ((-steps % totalPlates) + totalPlates) % totalPlates;

  plates.forEach((plate, index) => {
    const isTop = index === topIndex;
    const scale = isTop ? 1.38 : 1.05;

    plate.style.transform = `translate(-50%, -50%) rotate(${-currentRotation}deg) scale(${scale})`;

    if (isTop) {
      plate.classList.add('active');

      const newTitle = plate.getAttribute('data-name');
      const newDesc = plate.getAttribute('data-desc');
      const newFbTitle = plate.getAttribute('data-fb-title');
      const newFbText = plate.getAttribute('data-fb-text');
      const newFbUser = plate.getAttribute('data-fb-user');

      if (dishTitle.textContent !== newTitle) {
        // fade the old text out, swap it, then fade back in
        dishInfoCard.classList.add('swiping');
        feedbackCard.classList.add('swiping');
        dishTitle.style.opacity = '0';

        setTimeout(() => {
          dishTitle.textContent = newTitle;
          dishDesc.textContent = newDesc;
          feedbackTitle.textContent = newFbTitle;
          feedbackText.textContent = newFbText;
          feedbackUser.innerHTML = newFbUser;

          dishTitle.style.opacity = '1';
          dishInfoCard.classList.remove('swiping');
          feedbackCard.classList.remove('swiping');
        }, 150);
      }
    } else {
      plate.classList.remove('active');
    }
  });
}

updatePlates();

table.addEventListener('click', (event) => {
  const rect = table.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;

  if (event.clientX > centerX) {
    currentRotation += rotationStep;
  } else {
    currentRotation -= rotationStep;
  }

  table.style.transform = `rotate(${currentRotation}deg)`;
  updatePlates();
});
