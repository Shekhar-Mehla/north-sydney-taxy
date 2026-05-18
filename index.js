  /* ── NAV ── */
  function openMenu() { document.getElementById('mobileMenu').classList.add('open'); }
  function closeMenu() { document.getElementById('mobileMenu').classList.remove('open'); }

  /* ── WHEN ── */
  function setWhen(m) {
    document.getElementById('nowBtn').classList.toggle('active', m==='now');
    document.getElementById('laterBtn').classList.toggle('active', m==='later');
    document.getElementById('nowBtn').setAttribute('aria-pressed', m==='now');
    document.getElementById('laterBtn').setAttribute('aria-pressed', m==='later');
    document.getElementById('laterField').style.display = m==='later' ? 'block' : 'none';
  }

  /* ── VEHICLE ── */
  function pickVeh(el) {
    document.querySelectorAll('.veh-opt').forEach(v => {
      v.classList.remove('sel');
      v.setAttribute('aria-checked','false');
    });
    el.classList.add('sel');
    el.setAttribute('aria-checked','true');
  }

  /* ── STEPS ── */
  let step = 1;
  const progWidths = {1:'33%',2:'66%',3:'100%'};

  function goStep(n) {
    if (n > 1 && step === 1) {
      const p = document.getElementById('pickup').value.trim();
      if (!p) {
        document.getElementById('pickup').classList.add('err');
        toast('Please enter a pickup address.');
        document.getElementById('pickup').focus();
        return;
      }
      document.getElementById('pickup').classList.remove('err');
    }
    if (n > 2 && step === 2) {
      const name = document.getElementById('pName').value.trim();
      const ph = document.getElementById('pPhone').value.trim();
      const em = document.getElementById('pEmail').value.trim();
      if (!name || !ph || !em) { toast('Please enter your name, mobile, and email.'); return; }
    }

    document.getElementById('sp'+step).classList.remove('active');
    document.getElementById('sp'+n).classList.add('active');
    step = n;
    document.getElementById('progressFill').style.width = progWidths[n];
    window.scrollTo({ top: document.getElementById('booking').offsetTop - 80, behavior: 'smooth' });
  }

  /* ── SUBMIT ── */
  async function submitBook() {
    const btn = document.getElementById('bookBtn');
    btn.textContent = '⏳ Confirming…';
    btn.disabled = true;

    // Gather form data
    const pickup = document.getElementById('pickup').value.trim();
    const dest = document.getElementById('dest').value.trim();
    const when = document.getElementById('nowBtn').classList.contains('active') ? 'now' : 'later';
    const scheduledTime = when === 'later' ? document.querySelector('#laterField input').value : '';
    
    // Vehicle selection
    const selVeh = document.querySelector('.veh-opt.sel');
    const vehicle = selVeh ? selVeh.querySelector('.veh-name').textContent : 'Standard Sedan';

    // Contact
    const pName = document.getElementById('pName').value.trim();
    const pPhone = document.getElementById('pPhone').value.trim();
    const pEmail = document.getElementById('pEmail').value.trim();
    const notes = document.getElementById('notes').value.trim();

    try {
        const response = await fetch('/api/book', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                pickup, dest, when, scheduledTime, vehicle, pName, pPhone, pEmail, notes
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            ['sp1','sp2','sp3'].forEach(id => document.getElementById(id).classList.remove('active'));
            document.getElementById('successPanel').classList.add('active');
            document.getElementById('progressFill').style.width = '100%';
            document.getElementById('bookRef').textContent = 'Booking ref: ' + data.ref;
            if (data.warning) {
                toast(data.warning);
            }
        } else {
            toast(data.message || 'Error submitting booking.');
            btn.textContent = '🚕 Confirm Booking';
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Submission error:', error);
        toast('Connection error. Please try again.');
        btn.textContent = '🚕 Confirm Booking';
        btn.disabled = false;
    }
  }

  /* ── RESET ── */
  function resetBook() {
    document.getElementById('successPanel').classList.remove('active');
    document.getElementById('pickup').value = '';
    document.getElementById('dest').value = '';
    document.getElementById('pName').value = '';
    document.getElementById('pPhone').value = '';
    document.getElementById('pEmail').value = '';
    document.getElementById('notes').value = '';
    document.getElementById('charCount').textContent = '320 characters left';
    document.getElementById('bookBtn').textContent = '🚕 Confirm Booking';
    document.getElementById('bookBtn').disabled = false;
    step = 1;
    document.getElementById('sp1').classList.add('active');
    document.getElementById('progressFill').style.width = '33%';
    window.scrollTo({ top: document.getElementById('booking').offsetTop - 80, behavior: 'smooth' });
  }

  /* ── FILL ROUTE ── */
  function fillRoute(from, to) {
    document.getElementById('pickup').value = from;
    document.getElementById('dest').value = to;
  }

  function fillAndScroll(from, to) {
    fillRoute(from, to);
    window.scrollTo({ top: document.getElementById('booking').offsetTop - 80, behavior: 'smooth' });
  }

  /* ── FAQ ── */
  function toggleFaq(el) {
    const open = el.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(f => f.classList.remove('open'));
    if (!open) el.classList.add('open');
  }

  /* ── TOAST ── */
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3200);
  }

  /* ── CHAR COUNT ── */
  function countChars(ta) {
    document.getElementById('charCount').textContent = (320 - ta.value.length) + ' characters left';
  }

  /* ── AUTOCOMPLETE (OpenStreetMap) ── */
  let debounceTimer;

  async function showSuggestions(input, which) {
    const val = input.value.trim();
    const listId = 'ac-' + which;
    const list = document.getElementById(listId);
    
    if (val.length < 3) { 
        list.style.display = 'none'; 
        return; 
    }

    // Debounce to prevent spamming the API
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
        try {
            // Fetch from OpenStreetMap Nominatim, restricted to Australia
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&addressdetails=1&countrycodes=au&limit=5`;
            const response = await fetch(url, {
                headers: { 'Accept-Language': 'en-AU,en;q=0.9' }
            });
            const data = await response.json();

            list.innerHTML = '';
            
            if (!data || data.length === 0) { 
                list.style.display = 'none'; 
                return; 
            }

            data.forEach(item => {
                const div = document.createElement('div');
                div.className = 'ac-item';
                
                // Keep the name clean and concise
                const parts = item.display_name.split(', ');
                const cleanName = parts.length > 3 ? `${parts[0]}, ${parts[1]}, ${parts[2]}` : item.display_name;
                
                div.innerHTML = `📍 ${cleanName}`;
                div.addEventListener('click', () => {
                    input.value = cleanName;
                    list.style.display = 'none';
                });
                list.appendChild(div);
            });
            
            list.style.display = 'block';
        } catch (error) {
            console.error('Error fetching addresses:', error);
        }
    }, 400); // Wait 400ms after user stops typing
  }

  document.addEventListener('click', e => {
    ['ac-pickup','ac-dest'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.contains(e.target) && e.target.id !== id.replace('ac-','')) {
        el.style.display = 'none';
      }
    });
  });

  /* ── KEYBOARD: vehicle opts ── */
  document.querySelectorAll('.veh-opt').forEach(v => {
    v.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickVeh(v); }
    });
  });

  /* ── ROUTE CARDS keyboard ── */
  document.querySelectorAll('.route-card').forEach(c => {
    c.addEventListener('keydown', e => {
      if (e.key === 'Enter') c.click();
    });
  });
