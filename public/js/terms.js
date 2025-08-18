document.addEventListener('DOMContentLoaded', () => {
    const termsLink = document.getElementById('termsPopup');
    const termsModal = document.getElementById('termsModal');
    const closeIcon = document.getElementById('closeIcon');
    const closePopupBtn = document.getElementById('closePopupBtn');

    // Function to open the terms modal
    termsLink.addEventListener('click', () => {
        termsModal.classList.remove('hidden');
        
        // Fetch the terms.txt content and format it
        fetch('../text/terms.txt')
            .then(response => response.text())
            .then(data => {
                // Format text by replacing newlines with <br> or <p> tags
                const formattedText = data.split('\n\n').map(paragraph => `<p>${paragraph}</p>`).join('');
                document.getElementById('termsText').innerHTML = formattedText;
            })
            .catch(error => console.error('Error loading terms:', error));
    });

    // Function to close the modal when clicking on the close icon or button
    closeIcon.addEventListener('click', () => {
        termsModal.classList.add('hidden');
    });

});
