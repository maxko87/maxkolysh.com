document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.getElementById('animation-trigger');
    
    trigger.addEventListener('click', () => {
        // Hide the first trigger immediately
        trigger.classList.add('hide');
        
        const links = document.getElementsByTagName('a');
        
        Array.from(links).forEach((link, index) => {
            // Remove animation class if it exists
            link.classList.remove('swing-animation');
            
            // Force reflow
            void link.offsetWidth;
            
            // First link falls immediately, rest spread over 1.5 seconds
            const delay = index === 0 ? 0 : Math.random() * 1.5;
            link.style.animationDelay = `${delay}s`;
            
            // Add animation class
            link.classList.add('swing-animation');
        });

        // Create and add the red button after animation completes
        setTimeout(() => {
            const redButton = document.createElement('div');
            redButton.className = 'trigger-circle red-circle show';
            redButton.id = 'dropTrigger';
            document.body.appendChild(redButton);

            // Add click handler for the red button
            redButton.addEventListener('click', function() {
                const links = document.querySelectorAll('a');
                links.forEach((link, index) => {
                    // Remove the swing animation class but keep its final rotation
                    link.style.transform = 'rotate(-90deg)';
                    link.classList.remove('swing-animation');
                    
                    // Force reflow
                    void link.offsetWidth;
                    
                    setTimeout(() => {
                        link.classList.add('vertical-drop');
                    }, index * 100);
                });
                
                // Hide the red button
                this.classList.add('hide');
            });
        }, 4000);
    });
}); 