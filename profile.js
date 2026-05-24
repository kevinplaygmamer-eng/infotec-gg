document.addEventListener('DOMContentLoaded', () => {
    const profileCard = document.getElementById('profile-card');
    const profileEmpty = document.getElementById('profile-empty');
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profilePhone = document.getElementById('profile-phone');
    const profileCpf = document.getElementById('profile-cpf');
    const profileAddress = document.getElementById('profile-address');
    const profileLogout = document.getElementById('profile-logout');

    const stored = localStorage.getItem('registeredUser');
    const loggedIn = sessionStorage.getItem('userLoggedIn') === 'true';

    if (stored && loggedIn) {
        const user = JSON.parse(stored);
        profileName.textContent = user.name || '—';
        profileEmail.textContent = user.email || '—';
        profilePhone.textContent = user.phone || '—';
        profileCpf.textContent = user.cpf || '—';
        profileAddress.textContent = user.address || '—';
        profileCard.style.display = 'block';
        profileEmpty.style.display = 'none';
    } else if (stored) {
        const user = JSON.parse(stored);
        profileName.textContent = user.name || '—';
        profileEmail.textContent = user.email || '—';
        profilePhone.textContent = user.phone || '—';
        profileCpf.textContent = user.cpf || '—';
        profileAddress.textContent = user.address || '—';
        profileCard.style.display = 'block';
        profileEmpty.style.display = 'none';
    } else {
        profileCard.style.display = 'none';
        profileEmpty.style.display = 'block';
    }

    profileLogout.addEventListener('click', () => {
        sessionStorage.removeItem('userLoggedIn');
        window.location.href = 'index.html';
    });
});
