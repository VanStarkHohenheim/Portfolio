// Gestion de la modale pour les certifications
const modal = document.getElementById('cert-modal');
const modalTitle = document.getElementById('modal-title');
const modalPdf = document.getElementById('modal-pdf');
const modalLink = document.getElementById('modal-link');
const closeModal = document.getElementById('close-modal');

// Dictionnaire des compétences avec leurs certifications
const skills = {
    html: { // C'est SecNumacadémie ici
        title: 'ANSSI - SecNumacadémie',
        pdf: 'photo/anssi-cert.pdf', // Remplace par le chemin de ton fichier PDF
        link: 'https://www.credential.net/html-certification'
    },
    css: { // C'est THM ici
        title: 'THM -Learning Path Pre Security',
        pdf: 'photo/thm-cert.pdf', // Remplace par le chemin de ton fichier PDF
        link: 'https://tryhackme-certificates.s3-eu-west-1.amazonaws.com/THM-ENZBIFU49D.pdf'
    },
    python: {
        title: 'Python - Python Essentials 1 ',
        pdf: 'photo/python-cert.pdf', // Remplace par le chemin de ton fichier PDF
        link: 'https://www.credly.com/badges/fb443e33-7583-40ff-a817-802f7e00b754'
    },
    cybersecurity: {
        title: 'Cisco - Introduction to Cybersecurity',
        pdf: 'photo/cisco-cert.pdf', // Remplace par le chemin de ton fichier PDF
        link: 'https://www.credly.com/badges/dff92613-91a2-43bc-8aa9-0e3d9ee8bf4f'
    }
};

// Fonction pour afficher la modale avec les données correspondantes
const openModal = (skillKey) => {
    const skill = skills[skillKey];
    if (skill) {
        modalTitle.textContent = skill.title; // Met à jour le titre
        modalPdf.src = skill.pdf; // Met à jour le PDF intégré
        modalLink.href = skill.link; // Met à jour le lien externe
        modal.classList.add('active'); // Affiche la modale
        modal.style.display = "flex"; // S'assure que la modale est visible
    }
};

// Fermer la modale
closeModal.addEventListener('click', () => {
    modal.classList.remove('active'); // Cache la modale
    modal.style.display = "none"; // Masque complètement la modale
});

// Activer la modale lors du clic sur une compétence
document.querySelectorAll('.skill-card').forEach(card => {
    card.addEventListener('click', () => {
        const skillKey = card.getAttribute('data-skill'); // Récupère la compétence cliquée
        openModal(skillKey);
    });
});
