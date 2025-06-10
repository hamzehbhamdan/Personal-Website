// Project filters functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Isotope/Masonry after all images are loaded
    var grid = document.querySelector('.grid');
    
    // Wait for images to load
    imagesLoaded(grid, function() {
        var iso = new Isotope(grid, {
            itemSelector: '.grid-item',
            percentPosition: true,
            masonry: {
                columnWidth: '.grid-sizer'
            }
        });
        
        // Filter buttons
        var filterButtons = document.querySelectorAll('.filter-btn');
        
        filterButtons.forEach(function(button) {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                filterButtons.forEach(function(btn) {
                    btn.classList.remove('active');
                });
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Get filter value
                var filterValue = this.getAttribute('data-filter');
                
                if (filterValue === '*') {
                    // Show all items
                    iso.arrange({ filter: '*' });
                } else {
                    // Filter items
                    iso.arrange({ filter: filterValue });
                }
            });
        });
    });
});
