import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { createId } from '../../lib/id';
import { isSafeHttpUrl } from '../../lib/url';
import { useBoardStore } from '../../store/useBoardStore';
import type { Application, Contact } from '../../types/models';
import MarkdownLiteEditor from '../ui/MarkdownLiteEditor';
import TagInput from '../ui/TagInput';

interface ApplicationFormProps {
  application: Application;
}

const REMOTE_OPTIONS: { value: Application['remote'] | ''; label: string }[] = [
  { value: '', label: 'Not specified' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'Onsite' },
];

function ApplicationForm({ application }: ApplicationFormProps) {
  const updateApplication = useBoardStore((s) => s.updateApplication);

  const [url, setUrl] = useState(application.url ?? '');
  const [location, setLocation] = useState(application.location ?? '');
  const [salaryRange, setSalaryRange] = useState(application.salaryRange ?? '');
  const [source, setSource] = useState(application.source ?? '');
  const [resumeVersion, setResumeVersion] = useState(application.resumeVersion ?? '');
  const [notes, setNotes] = useState(application.notes);
  const [contacts, setContacts] = useState<Contact[]>(application.contacts);

  function commitField<K extends keyof Application>(field: K, value: Application[K]) {
    if (value !== application[field]) {
      updateApplication(application.id, { [field]: value } as Partial<Application>);
    }
  }

  function updateContactField(id: string, field: keyof Contact, value: string) {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  }

  function commitContacts(next: Contact[]) {
    updateApplication(application.id, { contacts: next });
  }

  function addContact() {
    const next = [...contacts, { id: createId(), name: '', role: '', email: '' }];
    setContacts(next);
    commitContacts(next);
  }

  function removeContact(id: string) {
    const next = contacts.filter((c) => c.id !== id);
    setContacts(next);
    commitContacts(next);
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Job posting URL</span>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={() => commitField('url', url || undefined)}
          placeholder="https://…"
          className="rounded border border-line bg-surface px-2 py-1.5 outline-none focus:border-action"
        />
        {url.trim() &&
          (isSafeHttpUrl(url) ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs"
              style={{ color: 'var(--action)' }}
            >
              Open job posting ↗
            </a>
          ) : (
            <span className="text-xs text-muted">
              Not a valid http/https link — shown as text only.
            </span>
          ))}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Location</span>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onBlur={() => commitField('location', location || undefined)}
          className="rounded border border-line bg-surface px-2 py-1.5 outline-none focus:border-action"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Remote</span>
        <select
          value={application.remote ?? ''}
          onChange={(e) =>
            commitField('remote', (e.target.value || undefined) as Application['remote'])
          }
          className="rounded border border-line bg-surface px-2 py-1.5"
        >
          {REMOTE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Salary range</span>
        <input
          value={salaryRange}
          onChange={(e) => setSalaryRange(e.target.value)}
          onBlur={() => commitField('salaryRange', salaryRange || undefined)}
          placeholder="₹18–24L"
          className="rounded border border-line bg-surface px-2 py-1.5 outline-none focus:border-action"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Source</span>
        <input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          onBlur={() => commitField('source', source || undefined)}
          placeholder="Referral, LinkedIn, careers page…"
          className="rounded border border-line bg-surface px-2 py-1.5 outline-none focus:border-action"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Resume version</span>
        <input
          value={resumeVersion}
          onChange={(e) => setResumeVersion(e.target.value)}
          onBlur={() => commitField('resumeVersion', resumeVersion || undefined)}
          placeholder="ResumeForge — Classic v2"
          className="rounded border border-line bg-surface px-2 py-1.5 outline-none focus:border-action"
        />
      </label>

      <div className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Tags</span>
        <TagInput
          tags={application.tags}
          onChange={(tags) => updateApplication(application.id, { tags })}
        />
      </div>

      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-medium">Contacts</span>
          <button
            type="button"
            onClick={addContact}
            className="flex items-center gap-1 text-xs"
            style={{ color: 'var(--action)' }}
          >
            <Plus size={14} /> Add contact
          </button>
        </div>
        {contacts.map((contact) => (
          <div key={contact.id} className="flex items-center gap-1.5">
            <input
              value={contact.name}
              onChange={(e) => updateContactField(contact.id, 'name', e.target.value)}
              onBlur={() => commitContacts(contacts)}
              placeholder="Name"
              aria-label="Contact name"
              className="w-1/3 rounded border border-line bg-surface px-2 py-1 text-sm outline-none focus:border-action"
            />
            <input
              value={contact.role ?? ''}
              onChange={(e) => updateContactField(contact.id, 'role', e.target.value)}
              onBlur={() => commitContacts(contacts)}
              placeholder="Role"
              aria-label="Contact role"
              className="w-1/3 rounded border border-line bg-surface px-2 py-1 text-sm outline-none focus:border-action"
            />
            <input
              value={contact.email ?? ''}
              onChange={(e) => updateContactField(contact.id, 'email', e.target.value)}
              onBlur={() => commitContacts(contacts)}
              placeholder="Email"
              aria-label="Contact email"
              className="w-1/3 rounded border border-line bg-surface px-2 py-1 text-sm outline-none focus:border-action"
            />
            <button
              type="button"
              onClick={() => removeContact(contact.id)}
              aria-label="Remove contact"
              title="Remove contact"
              className="text-muted hover:text-ink"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Notes</span>
        <MarkdownLiteEditor
          value={notes}
          onChange={setNotes}
          onBlur={() => commitField('notes', notes)}
          aria-label="Notes"
        />
      </div>
    </div>
  );
}

export default ApplicationForm;
