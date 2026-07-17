import { NavLink } from 'react-router-dom';
import { useUiStore } from '../../store/useUiStore';
import StageEditor from '../board/StageEditor';
import AboutModal from './AboutModal';
import ConfettiBurst from './ConfettiBurst';
import DeleteAllDataModal from './DeleteAllDataModal';
import ImportExportMenu from './ImportExportMenu';
import PrivacyModal from './PrivacyModal';
import SettingsMenu from './SettingsMenu';
import StreakChip from './StreakChip';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
    isActive ? 'bg-action text-on-action' : 'text-muted hover:text-ink'
  }`;

function TopBar() {
  const stageEditorOpen = useUiStore((s) => s.stageEditorOpen);
  const deleteAllDataModalOpen = useUiStore((s) => s.deleteAllDataModalOpen);
  const privacyModalOpen = useUiStore((s) => s.privacyModalOpen);
  const aboutModalOpen = useUiStore((s) => s.aboutModalOpen);

  return (
    <header className="sticky top-0 z-10 flex items-center gap-6 border-b border-line bg-surface px-4 py-3">
      <img
        src="/assets/prep_board_logo.png"
        alt="PrepBoard"
        width={1146}
        height={397}
        className="h-14 w-auto"
      />

      <nav aria-label="Main" className="flex gap-1">
        <NavLink to="/" end className={navLinkClass}>
          Board
        </NavLink>
        <NavLink to="/questions" className={navLinkClass}>
          Questions
        </NavLink>
        <NavLink to="/stats" className={navLinkClass}>
          Stats
        </NavLink>
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <StreakChip />
        <ImportExportMenu />
        <SettingsMenu />
      </div>

      {stageEditorOpen && <StageEditor />}
      {deleteAllDataModalOpen && <DeleteAllDataModal />}
      {privacyModalOpen && <PrivacyModal />}
      {aboutModalOpen && <AboutModal />}
      <ConfettiBurst />
    </header>
  );
}

export default TopBar;
