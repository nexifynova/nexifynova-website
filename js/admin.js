// ============================================================
// 1. ADMIN LOGIN (SECURE)
// ============================================================
window.promptAdmin = async function() {
    const admin = localStorage.getItem('nexify_admin');
    if (admin === 'true') {
        openPageModal('adminPage');
        loadAdminData();
    } else {
        const password = prompt('Enter admin password:');
        if (!password) return; // Agar cancel kar de toh ruk jaye

        // Database se password check karein
        const { data, error } = await window.supabaseClient
            .from('admin_settings')
            .select('admin_password')
            .eq('id', 1)
            .single();

        if (error) {
            alert('System error. Please try again.');
            return;
        }

        if (password === data.admin_password) {
            localStorage.setItem('nexify_admin', 'true');
            openPageModal('adminPage');
            loadAdminData();
        } else {
            alert('Invalid password!');
        }
    }
};

window.logoutAdmin = function() {
    localStorage.removeItem('nexify_admin');
};

window.switchTab = function(tab) {
    document.querySelectorAll('.admin-tabs button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('#blogTab, #projectsTab, #messagesTab, #clientsTab, #applicationsTab, #settingsTab').forEach(el => el.style.display = 'none');
    
    if (tab === 'blog') {
        document.querySelectorAll('.admin-tabs button')[0].classList.add('active');
        document.getElementById('blogTab').style.display = 'block';
        loadAdminBlogs();
    } else if (tab === 'projects') {
        document.querySelectorAll('.admin-tabs button')[1].classList.add('active');
        document.getElementById('projectsTab').style.display = 'block';
        loadAdminProjects();
    } else if (tab === 'messages') {
        document.querySelectorAll('.admin-tabs button')[2].classList.add('active');
        document.getElementById('messagesTab').style.display = 'block';
        loadMessages();
    } else if (tab === 'clients') {
        document.querySelectorAll('.admin-tabs button')[3].classList.add('active');
        document.getElementById('clientsTab').style.display = 'block';
        loadClients();
    } else if (tab === 'applications') {
        document.querySelectorAll('.admin-tabs button')[4].classList.add('active');
        document.getElementById('applicationsTab').style.display = 'block';
        loadApplications();
    } else if (tab === 'settings') {
        document.querySelectorAll('.admin-tabs button')[5].classList.add('active');
        document.getElementById('settingsTab').style.display = 'block';
        loadSiteSettingsAdmin();
    }
};

function loadAdminData() {
    loadAdminBlogs();
    loadAdminProjects();
    loadMessages();
    loadClients();
    loadApplications();
    updateDashboardStats();
}

function updateDashboardStats() {
    Promise.all([
        window.supabaseClient.from('projects').select('*', { count: 'exact', head: true }),
        window.supabaseClient.from('blogs').select('*', { count: 'exact', head: true }),
        window.supabaseClient.from('messages').select('*', { count: 'exact', head: true }),
        window.supabaseClient.from('clients').select('*', { count: 'exact', head: true })
    ]).then(([projects, blogs, messages, clients]) => {
        document.getElementById('statProjects').innerHTML = '<span>' + (projects.count || 0) + '</span>';
        document.getElementById('statBlogs').innerHTML = '<span>' + (blogs.count || 0) + '</span>';
        document.getElementById('statMessages').innerHTML = '<span>' + (messages.count || 0) + '</span>';
        document.getElementById('statClients').innerHTML = '<span>' + (clients.count || 0) + '</span>';
    }).catch(err => { console.error('Error fetching stats:', err); });
}

// ============================================================
// 2. PROJECTS CRUD
// ============================================================
async function loadProjectsFromSupabase() {
    try {
        const { data, error } = await window.supabaseClient.from('projects').select('*').order('id', { ascending: false });
        if (error) { renderProjectsFallback(); return; }
        renderProjects(data);
    } catch (err) { renderProjectsFallback(); }
}

function renderProjects(projects) {
    const grid = document.getElementById('projectsGrid');
    if (!projects || projects.length === 0) {
        grid.innerHTML = `<div class="no-blog-msg" style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);"><i class="fas fa-folder-open" style="font-size:2rem;display:block;margin-bottom:12px;"></i>No projects yet. Add one from the Admin panel.</div>`;
        return;
    }
    grid.innerHTML = '';
    projects.forEach(proj => {
        const card = document.createElement('div');
        card.className = 'project-card fade-in in-view';
        card.setAttribute('data-category', proj.category || 'general');
        card.innerHTML = `
            <a href="${proj.url || '#'}" target="_blank">
                <div class="project-image" onclick="event.preventDefault(); openLightbox('${proj.image || 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=600'}')">
                    <img src="${proj.image || 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=600'}" alt="${proj.name}" />
                    <span class="project-badge">Live</span>
                </div>
                <div class="project-content">
                    <div class="p-name">${proj.name}</div>
                    <div class="p-desc">${proj.description || ''}</div>
                    <div class="p-url">${proj.url ? proj.url.replace('https://','') : ''}</div>
                    <span class="p-link">Visit Project <i class="fas fa-arrow-right"></i></span>
                </div>
            </a>
        `;
        grid.appendChild(card);
    });
}

function renderProjectsFallback() {
    const projects = JSON.parse(localStorage.getItem('nexify_projects') || '[]');
    renderProjects(projects);
}

window.saveProject = async function() {
    const editId = document.getElementById('projEditId').value;
    if (editId) { updateProjectInSupabase(); return; }
    const name = document.getElementById('projName').value.trim();
    const desc = document.getElementById('projDesc').value.trim();
    const url = document.getElementById('projUrl').value.trim();
    const category = document.getElementById('projCategory').value.trim() || 'general';
    const image = document.getElementById('projImageUrl').value || 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=600';

    if (!name || !desc || !url) { alert('Please fill in Name, Description and URL.'); return; }
    try {
        const { error } = await window.supabaseClient.from('projects').insert([{ name, description: desc, url, category, image }]);
        if (error) { alert('Error saving project: ' + error.message); return; }
        resetProjectForm(); loadAdminProjects(); loadProjectsFromSupabase(); updateDashboardStats();
        alert('✅ Project added successfully!');
    } catch (err) { alert('Error saving project.'); }
};

function resetProjectForm() {
    document.getElementById('projName').value = '';
    document.getElementById('projDesc').value = '';
    document.getElementById('projUrl').value = '';
    document.getElementById('projCategory').value = '';
    document.getElementById('projImageFile').value = '';
    document.getElementById('projImagePreview').style.display = 'none';
    document.getElementById('projImageUrl').value = '';
    document.getElementById('projEditId').value = '';
    const btn = document.querySelector('#projectsTab .btn-primary');
    btn.innerHTML = '<i class="fas fa-save"></i> Save Project';
    btn.onclick = function() { saveProject(); };
}

async function updateProjectInSupabase() {
    const id = parseInt(document.getElementById('projEditId').value);
    if (!id) return;
    const name = document.getElementById('projName').value.trim();
    const desc = document.getElementById('projDesc').value.trim();
    const url = document.getElementById('projUrl').value.trim();
    const category = document.getElementById('projCategory').value.trim() || 'general';
    const image = document.getElementById('projImageUrl').value || 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=600';

    if (!name || !desc || !url) { alert('Please fill in Name, Description and URL.'); return; }
    try {
        const { error } = await window.supabaseClient.from('projects').update({ name, description: desc, url, category, image }).eq('id', id);
        if (error) { alert('Error updating project: ' + error.message); return; }
        resetProjectForm(); loadAdminProjects(); loadProjectsFromSupabase(); updateDashboardStats();
        alert('✅ Project updated successfully!');
    } catch (err) { alert('Error updating project.'); }
}

function editProject(id) {
    window.supabaseClient.from('projects').select('*').eq('id', id).single().then(({ data: proj, error }) => {
        if (error) { alert('Error fetching project: ' + error.message); return; }
        document.getElementById('projName').value = proj.name || '';
        document.getElementById('projDesc').value = proj.description || '';
        document.getElementById('projUrl').value = proj.url || '';
        document.getElementById('projCategory').value = proj.category || '';
        document.getElementById('projImageUrl').value = proj.image || '';
        const preview = document.getElementById('projImagePreview');
        if (proj.image) { preview.src = proj.image; preview.style.display = 'block'; } else { preview.style.display = 'none'; }
        document.getElementById('projEditId').value = proj.id;
        const btn = document.querySelector('#projectsTab .btn-primary');
        btn.innerHTML = '<i class="fas fa-edit"></i> Update Project';
        btn.onclick = function() { saveProject(); };
        document.querySelector('#projectsTab .admin-project-form').scrollIntoView({ behavior: 'smooth' });
    });
}

window.deleteProject = async function(id) {
    if (!confirm('Delete this project?')) return;
    try {
        const { error } = await window.supabaseClient.from('projects').delete().eq('id', id);
        if (error) { alert('Error deleting project: ' + error.message); return; }
        loadAdminProjects(); loadProjectsFromSupabase(); updateDashboardStats();
        alert('✅ Project deleted!');
    } catch (err) { alert('Error deleting project.'); }
};

function loadAdminProjects() {
    const list = document.getElementById('adminProjectsList');
    window.supabaseClient.from('projects').select('*').order('id', { ascending: false }).then(({ data, error }) => {
        if (error) { list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">Error loading projects.</p>'; return; }
        if (!data || data.length === 0) { list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">No projects yet.</p>'; return; }
        list.innerHTML = '';
        data.forEach(proj => {
            list.innerHTML += `
                <div class="admin-item">
                    <div class="item-content"><strong>${proj.name}</strong><small>${proj.url || ''} · ${proj.category || 'general'}</small></div>
                    <div class="item-actions">
                        <button class="icon-btn profile-btn" onclick="editProject(${proj.id})" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="icon-btn delete-btn" onclick="deleteProject(${proj.id})" title="Delete"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>`;
        });
    });
}

// ============================================================
// 3. BLOGS CRUD
// ============================================================
async function loadBlogsFromSupabase() {
    try {
        const { data, error } = await window.supabaseClient.from('blogs').select('*').order('id', { ascending: false });
        if (error) { renderBlogsFallback(); return; }
        renderBlogs(data);
    } catch (err) { renderBlogsFallback(); }
}

function renderBlogs(blogs) {
    const grid = document.getElementById('blogGrid');
    if (!blogs || blogs.length === 0) { grid.innerHTML = `<div class="no-blog-msg">No blog posts yet. Check back soon!</div>`; return; }
    grid.innerHTML = '';
    blogs.forEach(blog => {
        const fallbackImage = 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=600';
        const imageSrc = (blog.image && blog.image.trim() !== '') ? blog.image : fallbackImage;
        grid.innerHTML += `
            <div class="blog-card fade-in in-view">
                <a href="#" onclick="event.preventDefault(); openBlogArticle(${blog.id})">
                    <div class="blog-image"><img src="${imageSrc}" alt="${blog.title}" /><span class="blog-category">${blog.category || 'General'}</span></div>
                    <div class="blog-content">
                        <div class="blog-meta"><span><i class="far fa-calendar-alt"></i> ${blog.date || 'Recent'}</span><span><i class="far fa-clock"></i> 4 min read</span></div>
                        <h3 class="blog-title">${blog.title}</h3>
                        <p class="blog-excerpt">${blog.content.substring(0, 120)}${blog.content.length > 120 ? '...' : ''}</p>
                        <span class="blog-link">Read More <i class="fas fa-arrow-right"></i></span>
                    </div>
                </a>
            </div>`;
    });
}

function renderBlogsFallback() {
    const blogs = JSON.parse(localStorage.getItem('nexify_blogs') || '[]');
    renderBlogs(blogs);
}

window.openBlogArticle = function(id) {
    window.supabaseClient.from('blogs').select('*').eq('id', id).single().then(({ data: blog, error }) => {
        if (error) { alert('Error loading blog: ' + error.message); return; }
        const fallbackImage = 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2';
        const imageSrc = (blog.image && blog.image.trim() !== '') ? blog.image : fallbackImage;
        document.getElementById('blogArticleHeroImage').src = imageSrc;
        document.getElementById('blogArticleTitle').innerHTML = blog.title;
        document.getElementById('blogArticleDate').innerHTML = blog.date + ' | ' + blog.category;
        document.getElementById('blogArticleContent').innerHTML = blog.content;
        openPageModal('blogArticlePage');
    });
};

window.saveBlogPost = async function() {
    const editId = document.getElementById('blogEditId').value;
    if (editId) { updateBlogPostInSupabase(); return; }
    const title = document.getElementById('blogTitle').value.trim();
    const content = document.getElementById('blogContent').value.trim();
    const category = document.getElementById('blogCategory').value.trim() || 'General';
    const image = document.getElementById('blogImageUrl').value || document.getElementById('blogImage').value.trim() || 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=600';

    if (!title || !content) { alert('Please fill in Title and Content.'); return; }
    try {
        const { error } = await window.supabaseClient.from('blogs').insert([{ title, content, category, image, date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }]);
        if (error) { alert('Error saving blog: ' + error.message); return; }
        resetBlogForm(); loadAdminBlogs(); loadBlogsFromSupabase(); updateDashboardStats();
        alert('✅ Blog post published!');
    } catch (err) { alert('Error saving blog post.'); }
};

async function updateBlogPostInSupabase() {
    const id = parseInt(document.getElementById('blogEditId').value);
    if (!id) return;
    const title = document.getElementById('blogTitle').value.trim();
    const content = document.getElementById('blogContent').value.trim();
    const category = document.getElementById('blogCategory').value.trim() || 'General';
    const image = document.getElementById('blogImageUrl').value || document.getElementById('blogImage').value.trim() || 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=600';

    if (!title || !content) { alert('Please fill in Title and Content.'); return; }
    try {
        const { error } = await window.supabaseClient.from('blogs').update({ title, content, category, image }).eq('id', id);
        if (error) { alert('Error updating blog: ' + error.message); return; }
        resetBlogForm(); loadAdminBlogs(); loadBlogsFromSupabase(); updateDashboardStats();
        alert('✅ Blog post updated!');
    } catch (err) { alert('Error updating blog post.'); }
}

function editBlogPost(id) {
    window.supabaseClient.from('blogs').select('*').eq('id', id).single().then(({ data: blog, error }) => {
        if (error) { alert('Error fetching blog: ' + error.message); return; }
        document.getElementById('blogTitle').value = blog.title || '';
        document.getElementById('blogContent').value = blog.content || '';
        document.getElementById('blogCategory').value = blog.category || '';
        document.getElementById('blogImage').value = blog.image || '';
        document.getElementById('blogImageUrl').value = blog.image || '';
        const preview = document.getElementById('blogImagePreview');
        if (blog.image) { preview.src = blog.image; preview.style.display = 'block'; } else { preview.style.display = 'none'; }
        document.getElementById('blogEditId').value = blog.id;
        const btn = document.querySelector('#blogTab .btn-primary');
        btn.innerHTML = '<i class="fas fa-edit"></i> Update Post';
        btn.onclick = function() { saveBlogPost(); };
        document.querySelector('#blogTab .admin-project-form').scrollIntoView({ behavior: 'smooth' });
    });
}

function resetBlogForm() {
    document.getElementById('blogTitle').value = '';
    document.getElementById('blogContent').value = '';
    document.getElementById('blogCategory').value = '';
    document.getElementById('blogImage').value = '';
    document.getElementById('blogImageFile').value = '';
    document.getElementById('blogImageUrl').value = '';
    document.getElementById('blogImagePreview').style.display = 'none';
    document.getElementById('blogEditId').value = '';
    const btn = document.querySelector('#blogTab .btn-primary');
    btn.innerHTML = '<i class="fas fa-save"></i> Publish Post';
    btn.onclick = function() { saveBlogPost(); };
}

window.deleteBlogPost = async function(id) {
    if (!confirm('Delete this blog post?')) return;
    try {
        const { error } = await window.supabaseClient.from('blogs').delete().eq('id', id);
        if (error) { alert('Error deleting blog: ' + error.message); return; }
        loadAdminBlogs(); loadBlogsFromSupabase(); updateDashboardStats();
        alert('✅ Blog post deleted!');
    } catch (err) { alert('Error deleting blog post.'); }
};

function loadAdminBlogs() {
    const list = document.getElementById('adminBlogList');
    window.supabaseClient.from('blogs').select('*').order('id', { ascending: false }).then(({ data, error }) => {
        if (error) { list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">Error loading blogs.</p>'; return; }
        if (!data || data.length === 0) { list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">No blog posts yet.</p>'; return; }
        list.innerHTML = '';
        data.forEach(blog => {
            list.innerHTML += `
                <div class="admin-item">
                    <div class="item-content">
                        <strong>${blog.title}</strong>
                        <small><i class="far fa-calendar-alt"></i> ${blog.date || 'Recent'} · ${blog.category || 'General'}</small>
                        <p>${blog.content.substring(0, 120)}${blog.content.length > 120 ? '...' : ''}</p>
                    </div>
                    <div class="item-actions">
                        <button class="icon-btn profile-btn" onclick="editBlogPost(${blog.id})" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="icon-btn delete-btn" onclick="deleteBlogPost(${blog.id})" title="Delete"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>`;
        });
    });
}

// ============================================================
// 4. MESSAGES CRUD
// ============================================================
let allMessages = [];

function loadMessages() {
    window.supabaseClient.from('messages').select('*').order('id', { ascending: false }).then(({ data, error }) => {
        if (error) { document.getElementById('inquiryList').innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">Error loading messages.</p>'; return; }
        allMessages = data || [];
        filterMessages();
    });
}

function filterMessages() {
    const from = document.getElementById('msgFrom').value;
    const to = document.getElementById('msgTo').value;
    let filtered = allMessages;
    if (from) {
        const fromDate = new Date(from);
        filtered = filtered.filter(m => new Date(m.date) >= fromDate);
    }
    if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59);
        filtered = filtered.filter(m => new Date(m.date) <= toDate);
    }
    renderFilteredMessages(filtered);
}

function resetMessageFilter() {
    document.getElementById('msgFrom').value = '';
    document.getElementById('msgTo').value = '';
    renderFilteredMessages(allMessages);
}

function renderFilteredMessages(messages) {
    const list = document.getElementById('inquiryList');
    if (!messages || messages.length === 0) { list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">No messages.</p>'; return; }
    list.innerHTML = '';
    messages.forEach(msg => {
        list.innerHTML += `
            <div class="admin-item">
                <div class="item-content">
                    <strong>${msg.name}</strong>
                    <small><i class="fas fa-envelope"></i> ${msg.email} · ${msg.phone || 'N/A'}</small>
                    <p>${msg.message}</p>
                    <small style="color:#999;">${msg.date}</small>
                </div>
                <div class="item-actions">
                    <button class="icon-btn delete-btn" onclick="deleteMessage(${msg.id})" title="Delete"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>`;
    });
}

window.deleteMessage = async function(id) {
    if (!confirm('Delete this message?')) return;
    try {
        const { error } = await window.supabaseClient.from('messages').delete().eq('id', id);
        if (error) { alert('Error deleting message: ' + error.message); return; }
        loadMessages(); updateDashboardStats();
        alert('✅ Message deleted!');
    } catch (err) { alert('Error deleting message.'); }
};

// ============================================================
// 5. CLIENTS CRUD
// ============================================================
function loadClients() {
    const list = document.getElementById('clientsList');
    window.supabaseClient.from('clients').select('*').order('id', { ascending: false }).then(({ data, error }) => {
        if (error) { list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">Error loading clients.</p>'; return; }
        if (!data || data.length === 0) { list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">No registered clients.</p>'; return; }
        list.innerHTML = '';
        data.forEach(client => {
            list.innerHTML += `
                <div class="admin-item">
                    <div class="item-content">
                        <strong>${client.name}</strong>
                        <small><i class="fas fa-envelope"></i> ${client.email}</small>
                        <small style="display:block;color:#999;">Registered: ${client.date || 'N/A'}</small>
                    </div>
                    <div class="item-actions">
                        <button class="icon-btn profile-btn" onclick="viewClientProfile(${client.id})" title="View Profile"><i class="fas fa-id-card"></i></button>
                        <button class="icon-btn delete-btn" onclick="deleteClient(${client.id})" title="Delete Client"><i class="fas fa-user-slash"></i></button>
                    </div>
                </div>`;
        });
    });
}

window.deleteClient = async function(id) {
    if (!confirm('Delete this client permanently?')) return;
    try {
        const { error } = await window.supabaseClient.from('clients').delete().eq('id', id);
        if (error) { alert('Error deleting client: ' + error.message); return; }
        if (currentUser && currentUser.id === id) { logoutUser(); }
        loadClients(); updateDashboardStats();
        alert('✅ Client deleted successfully.');
    } catch (err) { alert('Error deleting client.'); }
};

window.viewClientProfile = function(id) {
    window.supabaseClient.from('clients').select('*').eq('id', id).single().then(({ data: client, error }) => {
        if (error || !client) { alert('Client not found.'); return; }
        document.getElementById('clientProfileName').textContent = client.name || '—';
        document.getElementById('clientProfileEmail').textContent = client.email || '—';
        document.getElementById('cpPhone').textContent = client.phone || '—';
        document.getElementById('cpCity').textContent = client.city || '—';
        document.getElementById('cpBusiness').textContent = client.business || '—';
        document.getElementById('cpBizType').textContent = client.biz_type || '—';
        document.getElementById('cpDate').textContent = client.date || '—';
        document.getElementById('clientProfileModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    });
};

function closeClientProfile() {
    document.getElementById('clientProfileModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// ============================================================
// 6. JOB APPLICATIONS
// ============================================================
function loadApplications() {
    const list = document.getElementById('applicationsList');
    list.innerHTML = '<p style="text-align:center;">Loading...</p>';
    
    window.supabaseClient.from('job_applications').select('*').order('id', { ascending: false }).then(({ data, error }) => {
        if (error) { list.innerHTML = '<p style="color:red;text-align:center;">Error loading data.</p>'; return; }
        if (!data || data.length === 0) { list.innerHTML = '<p style="text-align:center;color:var(--text-muted);">No applications yet.</p>'; return; }
        
        list.innerHTML = '';
        data.forEach(app => {
            list.innerHTML += `
                <div class="admin-item">
                    <div class="item-content">
                        <strong>${app.name} <span style="color:var(--accent-gold);font-size:0.8rem;">(${app.position})</span></strong>
                        <small><i class="fas fa-envelope"></i> ${app.email} | <i class="fas fa-phone"></i> ${app.phone || 'N/A'}</small>
                        <small style="display:block; color:#999;">Applied: ${app.date}</small>
                    </div>
                    <div class="item-actions">
                        <a href="${app.cv_url}" target="_blank" class="icon-btn profile-btn" title="Download CV" style="text-decoration:none;"><i class="fas fa-file-pdf"></i></a>
                        <button class="icon-btn delete-btn" onclick="deleteApplication(${app.id})" title="Delete"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>`;
        });
    });
}

window.deleteApplication = async function(id) {
    if (!confirm('Delete this application?')) return;
    await window.supabaseClient.from('job_applications').delete().eq('id', id);
    loadApplications();
};

// ============================================================
// 7. SITE SETTINGS (WITH DRAG & DROP & CONTACT INFO)
// ============================================================
const defaultNavs = [
    { id: 'nav-home', label: 'Home' },
    { id: 'nav-ceo', label: 'CEO' },
    { id: 'nav-vision', label: 'Vision' },
    { id: 'nav-team', label: 'Team' },
    { id: 'nav-career', label: 'Careers' },
    { id: 'nav-admin', label: 'Admin' },       
    { id: 'nav-contact', label: 'Contact' },
    { id: 'nav-services', label: 'Services' }, 
    { id: 'nav-showcase', label: 'Solutions' },
    { id: 'nav-projects', label: 'Projects' }, 
    { id: 'nav-testimonials', label: 'Testimonials' }, 
    { id: 'nav-blog', label: 'Blog' }          
];

function loadSiteSettingsAdmin() {
    const list = document.getElementById('navControlList');
    list.innerHTML = '';

    if (!document.getElementById('sortablejs')) {
        const script = document.createElement('script');
        script.id = 'sortablejs';
        script.src = 'https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js';
        document.body.appendChild(script);
    }

    window.supabaseClient.from('site_settings').select('*').eq('id', 1).single().then(({ data }) => {
        const hiddenNavs = data?.nav_items || [];
        const hiddenSecs = data?.hidden_sections || [];
        const savedOrder = data?.nav_order || defaultNavs.map(n => n.id);
        
        // Naya: Contact Info fetch karein
        const contactInfo = data?.contact_info || {};

        let sortedNavs = [...defaultNavs].sort((a, b) => {
            return savedOrder.indexOf(a.id) - savedOrder.indexOf(b.id);
        });

        sortedNavs.forEach(nav => {
            const isChecked = hiddenNavs.includes(nav.id) ? 'checked' : '';
            list.innerHTML += `
                <div class="sortable-item" data-id="${nav.id}" style="display:flex; align-items:center; justify-content:space-between; background:var(--bg-card); padding:12px; border-radius:8px; border:1px solid var(--border-subtle); cursor:grab; user-select:none;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-grip-vertical" style="color:var(--text-muted);"></i>
                        <span style="font-weight:600;">${nav.label}</span>
                    </div>
                    <label style="display:flex; align-items:center; gap:8px; margin:0; cursor:pointer;">
                        <input type="checkbox" value="${nav.id}" class="nav-hide-checkbox" ${isChecked} /> Hide
                    </label>
                </div>`;
        });

        setTimeout(() => {
            if (typeof Sortable !== 'undefined') {
                new Sortable(list, {
                    animation: 150,
                    ghostClass: 'sortable-ghost',
                    onEnd: function() {
                        saveNavOrder();
                    }
                });
            }
        }, 500);

        document.getElementById('toggleTestimonials').checked = hiddenSecs.includes('testimonials');
        document.getElementById('toggleShowcase').checked = hiddenSecs.includes('showcase');

        // Contact info inputs fill karein
        document.getElementById('set-address').value = contactInfo.address || '';
        document.getElementById('set-phone1').value = contactInfo.phone1 || '';
        document.getElementById('set-phone2').value = contactInfo.phone2 || '';
        document.getElementById('set-email1').value = contactInfo.email1 || '';
        document.getElementById('set-email2').value = contactInfo.email2 || '';
        document.getElementById('set-website').value = contactInfo.website || '';
    });
}

async function saveNavOrder() {
    const orderedIds = Array.from(document.querySelectorAll('.sortable-item')).map(item => item.dataset.id);
    await window.supabaseClient.from('site_settings').update({ nav_order: orderedIds }).eq('id', 1);
}

window.saveSiteSettings = async function() {
    const hiddenNavs = Array.from(document.querySelectorAll('.nav-hide-checkbox:checked')).map(cb => cb.value);
    const hiddenSecs = [];
    if (document.getElementById('toggleTestimonials').checked) hiddenSecs.push('testimonials');
    if (document.getElementById('toggleShowcase').checked) hiddenSecs.push('showcase');

    const orderedIds = Array.from(document.querySelectorAll('.sortable-item')).map(item => item.dataset.id);

    // Naya: Contact Info save karein
    const contactInfo = {
        address: document.getElementById('set-address').value,
        phone1: document.getElementById('set-phone1').value,
        phone2: document.getElementById('set-phone2').value,
        email1: document.getElementById('set-email1').value,
        email2: document.getElementById('set-email2').value,
        website: document.getElementById('set-website').value
    };

    const { error } = await window.supabaseClient.from('site_settings').update({
        nav_items: hiddenNavs,
        hidden_sections: hiddenSecs,
        nav_order: orderedIds,
        contact_info: contactInfo
    }).eq('id', 1);

    if (error) { alert('Error saving: ' + error.message); return; }
    alert('✅ Settings saved! Page will reload to apply changes.');
    window.location.reload();
};

// ============================================================
// 8. IMAGE PREVIEW & COMPRESSION
// ============================================================
function compressImage(file, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
            } else {
                if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            callback(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

window.previewProjectImage = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    compressImage(file, function(compressedDataUrl) {
        const preview = document.getElementById('projImagePreview');
        preview.src = compressedDataUrl;
        preview.style.display = 'block';
        document.getElementById('projImageUrl').value = compressedDataUrl;
    });
};

window.previewBlogImage = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    compressImage(file, function(compressedDataUrl) {
        const preview = document.getElementById('blogImagePreview');
        preview.src = compressedDataUrl;
        preview.style.display = 'block';
        document.getElementById('blogImageUrl').value = compressedDataUrl;
    });
};
