// ============================================================
// 0. LOADING SKELETON & INIT
// ============================================================
window.addEventListener('load', function() {
    const skeleton = document.getElementById('loadingSkeleton');
    setTimeout(function() { skeleton.classList.add('hidden'); }, 600);
    
    if(typeof loadProjectsFromSupabase === 'function') loadProjectsFromSupabase();
    if(typeof loadBlogsFromSupabase === 'function') loadBlogsFromSupabase();
    if(typeof updateDashboardStats === 'function') updateDashboardStats();
});

// ============================================================
// 1. CUSTOM CURSOR (Fixed White Dot Issue)
// ============================================================
const cursor = document.getElementById('customCursor');
const dot = cursor.querySelector('.cursor-dot');
const ring = cursor.querySelector('.cursor-ring');
let mouseX = 0, mouseY = 0;
let ringX = 0, ringY = 0;

// Shuru mein cursor ko chupao
dot.style.transform = 'translate3d(-100px, -100px, 0)';
ring.style.transform = 'translate3d(-100px, -100px, 0)';
cursor.style.opacity = '0';

const handleMouseMove = (e) => {
    cursor.style.opacity = '1';
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
    ringX += (mouseX - ringX) * 0.08;
    ringY += (mouseY - ringY) * 0.08;
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
};

document.addEventListener('mousemove', handleMouseMove);
document.addEventListener('mouseover', handleMouseMove);
document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; });
document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; });

const hoverElements = document.querySelectorAll('a, button, .btn, .logo-wrapper, .project-card a, .nav-links a, .theme-toggle, .hamburger, .btn-filter, .delete-btn, .logout-btn, .modal-close-btn, .dropdown-trigger, .dropdown-menu a, .icon-btn, .close-profile-btn');
hoverElements.forEach(el => {
    el.addEventListener('mouseenter', function() { cursor.classList.add('hover'); });
    el.addEventListener('mouseleave', function() { cursor.classList.remove('hover'); });
});

// ============================================================
// 2. PARTICLE BACKGROUND
// ============================================================
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
let animationId;

function resizeCanvas() {
    const hero = canvas.parentElement;
    const rect = hero.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}
class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4;
        this.opacity = Math.random() * 0.3 + 0.1;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(212, 160, 43, ' + this.opacity + ')';
        ctx.fill();
        for (let i = 0; i < particles.length; i++) {
            const dx = this.x - particles[i].x;
            const dy = this.y - particles[i].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 120) {
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(particles[i].x, particles[i].y);
                ctx.strokeStyle = 'rgba(212, 160, 43, ' + (0.06 * (1 - distance / 120)) + ')';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
    }
}

function initParticles() {
    const count = Math.min(Math.floor((canvas.width * canvas.height) / 8000), 120);
    particles = [];
    for (let i = 0; i < count; i++) { particles.push(new Particle()); }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    animationId = requestAnimationFrame(animateParticles);
}

function startParticles() {
    resizeCanvas();
    initParticles();
    animateParticles();
}
window.addEventListener('resize', function() { resizeCanvas(); initParticles(); });
setTimeout(startParticles, 100);

// ============================================================
// 3. NAVBAR & MODALS
// ============================================================
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger.addEventListener('click', function() {
    this.classList.toggle('active');
    navLinks.classList.toggle('open');
});
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
    });
});

function toggleUserDropdown() {
    const menu = document.getElementById('userDropdownMenu');
    const trigger = document.getElementById('userDropdownTrigger');
    menu.classList.toggle('open');
    trigger.classList.toggle('open');
}

function closeUserDropdown() {
    const menu = document.getElementById('userDropdownMenu');
    const trigger = document.getElementById('userDropdownTrigger');
    menu.classList.remove('open');
    trigger.classList.remove('open');
}

document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('userDropdown');
    if (!dropdown.contains(e.target)) { closeUserDropdown(); }
});

window.scrollToTop = function() { window.scrollTo({ top: 0, behavior: 'smooth' }); };

window.openPageModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) { modal.style.display = 'block'; document.body.style.overflow = 'hidden'; modal.scrollTop = 0; }
};
window.closePageModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) { modal.style.display = 'none'; document.body.style.overflow = 'auto'; }
};
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        document.querySelectorAll('.page-modal').forEach(m => {
            if (m.style.display === 'block') { m.style.display = 'none'; document.body.style.overflow = 'auto'; }
        });
        if (document.getElementById('clientProfileModal').style.display === 'flex') { closeClientProfile(); }
    }
});

// Lightbox
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
window.openLightbox = function(src) {
    lightboxImage.src = src;
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};
window.closeLightbox = function() {
    lightbox.style.display = 'none';
    document.body.style.overflow = 'auto';
};

// ============================================================
// 4. AUTH & PROFILE (Login, Register, Logout)
// ============================================================
let currentUser = null;

function getCurrentUser() {
    const userJson = localStorage.getItem('nexify_current_user');
    if (userJson) {
        currentUser = JSON.parse(userJson);
        updateNavbarUser();
        return currentUser;
    }
    return null;
}

function updateNavbarUser() {
    const label = document.getElementById('userDropdownLabel');
    const loginItem = document.querySelector('#userDropdownMenu li:nth-child(1)');
    const registerItem = document.querySelector('#userDropdownMenu li:nth-child(2)');
    const divider = document.getElementById('dropdownDivider');
    const profileItem = document.getElementById('profileDropdownItem');
    const logoutItem = document.getElementById('logoutDropdownItem');

    if (currentUser) {
        label.textContent = currentUser.name;
        loginItem.style.display = 'none';
        registerItem.style.display = 'none';
        divider.style.display = 'block';
        profileItem.style.display = 'block';
        logoutItem.style.display = 'block';
    } else {
        label.textContent = 'Guest';
        loginItem.style.display = 'block';
        registerItem.style.display = 'block';
        divider.style.display = 'none';
        profileItem.style.display = 'none';
        logoutItem.style.display = 'none';
    }
}

function logoutUser() {
    currentUser = null;
    localStorage.removeItem('nexify_current_user');
    updateNavbarUser();
    closeUserDropdown();
    alert('Logged out.');
    closePageModal('profilePage');
    closePageModal('loginPage');
}

function loadProfile() {
    if (!currentUser) return;
    document.getElementById('profileName').value = currentUser.name || '';
    document.getElementById('profileEmail').value = currentUser.email || '';
    document.getElementById('profilePhone').value = currentUser.phone || '';
    document.getElementById('profileCity').value = currentUser.city || '';
    document.getElementById('profileBusiness').value = currentUser.business || '';
    document.getElementById('profileBizType').value = currentUser.biz_type || '';
}

// Register Form
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirm').value;

    if (!name || !email || !password) { alert('Please fill in all fields.'); return; }
    if (password !== confirm) { alert('Passwords do not match.'); return; }
    if (password.length < 6) { alert('Password must be at least 6 characters.'); return; }

    try {
        const { data: existing } = await window.supabaseClient.from('clients').select('email').eq('email', email).single();
        if (existing) { alert('Email already registered.'); return; }

        const newUser = { name, email, password, phone: '', city: '', business: '', biz_type: '', date: new Date().toLocaleString() };
        const { data: createdUser, error } = await window.supabaseClient.from('clients').insert([newUser]).select().single();

        if (error) { alert('Registration error: ' + error.message); return; }

        currentUser = createdUser;
        localStorage.setItem('nexify_current_user', JSON.stringify(currentUser));
        document.getElementById('registerSuccess').style.display = 'block';
        this.reset();
        if(typeof updateDashboardStats === 'function') updateDashboardStats();
        updateNavbarUser();
        setTimeout(() => {
            closePageModal('registerPage');
            alert('Registration successful! Welcome, ' + currentUser.name);
            loadProfile();
        }, 500);
    } catch (err) { alert('Error registering user.'); }
});

// Login Form
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    try {
        const { data, error } = await window.supabaseClient.from('clients').select('*').eq('email', email).eq('password', password).single();
        if (error || !data) {
            document.getElementById('loginError').style.display = 'block';
            setTimeout(() => { document.getElementById('loginError').style.display = 'none'; }, 3000);
            return;
        }
        currentUser = data;
        localStorage.setItem('nexify_current_user', JSON.stringify(data));
        closePageModal('loginPage');
        updateNavbarUser();
        loadProfile();
        alert('Welcome back, ' + data.name + '!');
    } catch (err) {
        document.getElementById('loginError').style.display = 'block';
        setTimeout(() => { document.getElementById('loginError').style.display = 'none'; }, 3000);
    }
});

// Profile Update
document.getElementById('profileForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!currentUser) { alert('Please sign in first.'); return; }

    const updatedData = {
        name: document.getElementById('profileName').value.trim(),
        email: document.getElementById('profileEmail').value.trim(),
        phone: document.getElementById('profilePhone').value.trim(),
        city: document.getElementById('profileCity').value.trim(),
        business: document.getElementById('profileBusiness').value.trim(),
        biz_type: document.getElementById('profileBizType').value.trim()
    };

    try {
        const { error } = await window.supabaseClient.from('clients').update(updatedData).eq('id', currentUser.id);
        if (error) { alert('Error updating profile: ' + error.message); return; }
        
        currentUser = { ...currentUser, ...updatedData };
        localStorage.setItem('nexify_current_user', JSON.stringify(currentUser));
        updateNavbarUser();
        document.getElementById('profileSuccess').style.display = 'block';
        setTimeout(() => { document.getElementById('profileSuccess').style.display = 'none'; }, 3000);
    } catch (err) { alert('Error updating profile.'); }
});

// ============================================================
// 5. CONTACT FORMS
// ============================================================
document.getElementById('contactForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    const message = document.getElementById('contactMessage').value.trim();

    if (!name || !email || !message) { alert('Please fill in all required fields.'); return; }

    try {
        const { error } = await window.supabaseClient.from('messages').insert([{ name, email, phone: phone || '', message, date: new Date().toLocaleString() }]);
        if (error) { alert('Error sending message: ' + error.message); return; }

        document.getElementById('successMsg').style.display = 'block';
        this.reset();
        setTimeout(() => { document.getElementById('successMsg').style.display = 'none'; }, 5000);
        alert('✅ Thank you! Your message has been received.');
        if(typeof updateDashboardStats === 'function') updateDashboardStats();
    } catch (err) { alert('Error sending message.'); }
});

document.getElementById('contactFormModal').addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('contactNameModal').value.trim();
    const email = document.getElementById('contactEmailModal').value.trim();
    const phone = document.getElementById('contactPhoneModal').value.trim();
    const message = document.getElementById('contactMessageModal').value.trim();

    if (!name || !email || !message) { alert('Please fill in all required fields.'); return; }

    try {
        const { error } = await window.supabaseClient.from('messages').insert([{ name, email, phone: phone || '', message, date: new Date().toLocaleString() }]);
        if (error) { alert('Error sending message: ' + error.message); return; }

        document.getElementById('successMsgModal').style.display = 'block';
        this.reset();
        setTimeout(() => { document.getElementById('successMsgModal').style.display = 'none'; }, 5000);
        alert('✅ Thank you! Your message has been received.');
        if(typeof updateDashboardStats === 'function') updateDashboardStats();
    } catch (err) { alert('Error sending message.'); }
});

// ============================================================
// 6. CAREER FORM SUBMIT (CV UPLOAD)
// ============================================================
document.getElementById('careerForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = document.getElementById('careerSubmitBtn');
    const name = document.getElementById('careerName').value.trim();
    const email = document.getElementById('careerEmail').value.trim();
    const phone = document.getElementById('careerPhone').value.trim();
    const position = document.getElementById('careerPosition').value;
    const file = document.getElementById('careerCV').files[0];

    if (!name || !email || !position || !file) { alert('Please fill all required fields and upload your CV.'); return; }

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    btn.disabled = true;

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${name.replace(/ /g, '_')}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await window.supabaseClient.storage.from('cvs').upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = window.supabaseClient.storage.from('cvs').getPublicUrl(fileName);

        const { error: dbError } = await window.supabaseClient.from('job_applications').insert([{
            name, email, phone, position, cv_url: urlData.publicUrl, date: new Date().toLocaleString()
        }]);

        if (dbError) throw dbError;

        document.getElementById('careerSuccessMsg').style.display = 'block';
        this.reset();
        document.getElementById('cvFileName').innerHTML = '<i class="fas fa-upload"></i> Choose File';
        setTimeout(() => { document.getElementById('careerSuccessMsg').style.display = 'none'; }, 5000);
        alert('✅ Application submitted successfully!');

    } catch (error) {
        console.error(error);
        alert('Error submitting application: ' + error.message);
    } finally {
        btn.innerHTML = 'Submit Application';
        btn.disabled = false;
    }
});

// ============================================================
// 7. SITE SETTINGS APPLY (SORT, HIDE, & CONTACT INFO)
// ============================================================
async function loadAndApplySettings() {
    try {
        const { data, error } = await window.supabaseClient.from('site_settings').select('*').eq('id', 1).single();
        if (error || !data) return;

        const hiddenNavs = data.nav_items || [];
        const savedOrder = data.nav_order;
        const hiddenSecs = data.hidden_sections || [];
        const contactInfo = data.contact_info || {};

        // 1. Apply Sorting (Tarteeb)
        if (savedOrder && savedOrder.length > 0) {
            const container = document.getElementById('dynamicNavContainer');
            if (container) {
                const children = Array.from(container.children);
                children.sort((a, b) => {
                    const indexA = savedOrder.indexOf(a.id);
                    const indexB = savedOrder.indexOf(b.id);
                    if (indexA === -1) return 1;
                    if (indexB === -1) return -1;
                    return indexA - indexB;
                });
                children.forEach(child => container.appendChild(child));
            }
        }

        // 2. Apply Hide (Gayab karna)
        hiddenNavs.forEach(id => {
            const elements = document.querySelectorAll(`[id="${id}"]`);
            elements.forEach(el => { el.style.display = 'none'; });
        });

        // 3. Hide Sections
        hiddenSecs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        // 4. Apply Contact Information (Naya Feature)
        if (contactInfo) {
            const updateText = (id, value, isLink = false) => {
                const el = document.getElementById(id);
                if (el && value) {
                    el.textContent = value;
                    if (isLink) {
                        if (id.includes('email')) el.href = `mailto:${value}`;
                        if (id.includes('website')) el.href = value.startsWith('http') ? value : `https://${value}`;
                    }
                }
            };

            // Home Page Contact Section
            updateText('contact-address', contactInfo.address);
            updateText('contact-phone1', contactInfo.phone1);
            updateText('contact-phone2', contactInfo.phone2);
            updateText('contact-email1', contactInfo.email1, true);
            updateText('contact-email2', contactInfo.email2, true);
            updateText('contact-website', contactInfo.website, true);

            // Contact Page Modal
            updateText('modal-contact-address', contactInfo.address);
            updateText('modal-contact-phone1', contactInfo.phone1);
            updateText('modal-contact-phone2', contactInfo.phone2);
            updateText('modal-contact-email1', contactInfo.email1, true);
            updateText('modal-contact-email2', contactInfo.email2, true);
            updateText('modal-contact-website', contactInfo.website, true);

            // CTA Section
            updateText('cta-phone1', contactInfo.phone1);
            updateText('cta-phone2', contactInfo.phone2);
            updateText('cta-email1', contactInfo.email1, true);
            updateText('cta-address', contactInfo.address);
        }

    } catch (err) { console.error("Error applying settings:", err); }
}

// ============================================================
// 8. SCROLL & ANIMATIONS
// ============================================================
const backToTopBtn = document.getElementById('backToTop');
window.addEventListener('scroll', function() {
    if (window.scrollY > 400) { backToTopBtn.classList.add('visible'); } else { backToTopBtn.classList.remove('visible'); }
});
backToTopBtn.addEventListener('click', function() { window.scrollTo({ top: 0, behavior: 'smooth' }); });

window.addEventListener('scroll', function() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    document.documentElement.style.setProperty('--scroll-progress', scrollPercent + '%');
});

const counters = document.querySelectorAll('.counter-number');
let countersAnimated = false;
function animateCounters() {
    if (countersAnimated) return;
    const trustBar = document.getElementById('trustBar');
    const rect = trustBar.getBoundingClientRect();
    if (rect.top < window.innerHeight - 100) {
        countersAnimated = true;
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            let current = 0;
            const increment = target / 60;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) { counter.textContent = target; clearInterval(timer); } 
                else { counter.textContent = Math.floor(current); }
            }, 20);
        });
    }
}
window.addEventListener('scroll', animateCounters);
window.addEventListener('load', function() { setTimeout(animateCounters, 500); });

// Typing Animation
(function typingAnimation() {
    const heading = document.getElementById('typingHeading');
    const part1 = "Intelligent Digital Systems for a ";
    const part2 = "Global Economy";
    heading.innerHTML = '<span id="typingPart1"></span><span id="typingPart2"></span><span class="typing-cursor" id="typingCursor"></span>';
    const part1Span = document.getElementById('typingPart1');
    const part2Span = document.getElementById('typingPart2');
    const newCursor = document.getElementById('typingCursor');
    let index1 = 0, index2 = 0, isPart2 = false;

    function typeNext() {
        if (!isPart2) {
            if (index1 < part1.length) {
                part1Span.textContent += part1.charAt(index1);
                index1++;
                setTimeout(typeNext, 40);
            } else {
                isPart2 = true;
                part2Span.innerHTML = '<span style="color:var(--accent-gold);"></span>';
                setTimeout(typeNext, 200);
            }
        } else {
            const goldSpan = part2Span.querySelector('span');
            if (index2 < part2.length) {
                goldSpan.textContent += part2.charAt(index2);
                index2++;
                setTimeout(typeNext, 40);
            } else { newCursor.classList.add('hidden-cursor'); }
        }
    }
    setTimeout(typeNext, 800);
})();

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const savedTheme = localStorage.getItem('nexify_theme');
if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
    themeIcon.className = 'fas fa-sun';
}
themeToggle.addEventListener('click', function() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    themeIcon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('nexify_theme', isLight ? 'light' : 'dark');
});

// Project Filter
const filterButtons = document.querySelectorAll('.btn-filter');
filterButtons.forEach(button => {
    button.addEventListener('click', function() {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        const filterValue = this.getAttribute('data-filter');
        document.querySelectorAll('.project-card').forEach(card => {
            if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                card.style.display = 'block';
                setTimeout(() => { card.style.opacity = '1'; card.style.transform = 'scale(1)'; }, 10);
            } else {
                card.style.opacity = '0';
                card.style.transform = 'scale(0.9)';
                setTimeout(() => { card.style.display = 'none'; }, 300);
            }
        });
    });
});

// Fade-in Observer
const fadeElements = document.querySelectorAll('.fade-in');
const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('in-view'); }
    });
}, { root: null, rootMargin: '0px 0px -80px 0px', threshold: 0.1 });
fadeElements.forEach(el => observer.observe(el));

// Initial Load
document.addEventListener('DOMContentLoaded', function() {
    getCurrentUser();
    loadAndApplySettings();
});
