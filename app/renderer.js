// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.


(function(window, document, undefined) {


    console.log('here here');
    const feedback = document.getElementById('feedback');
    const feedbackText = feedback.querySelector('.fading-text');
    const timeSelect = document.getElementById('time-select');
    const timeSelectText = timeSelect.querySelector('.fading-text');

    function onYes(event) {
        event.stopPropagation();
        event.preventDefault();
        feedbackText.classList.remove('visible');
        setTimeout(() => {
            feedback.classList.add('closed');
            setTimeout(() => {
                timeSelect.classList.remove('closed');
                setTimeout(() => {
                    timeSelectText.classList.add('visible');
                }, 140);
            }, 280);
        }, 140);
    }

    document.getElementById('yes').addEventListener('click', onYes);

}(window, window.document))
