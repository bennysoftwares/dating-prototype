import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Screen } from '../../components/layout';
import { BottomSheet, Button, Icon, IconButton, LoadingRegion, Skeleton, useToast } from '../../components/ui';
import type { Verification } from '../../domain/types';
import { useOwnProfile } from '../../hooks/useOwnProfile';
import { useAccount } from '../../session/useAccount';
import { sleep } from '../../utils/sleep';
import './Settings.css';

type Flow = 'photo' | 'id' | null;

/**
 * Mock verification. Clear that a badge confirms photos (or ID) match the person,
 * never that someone is safe.
 */
export function VerificationScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const own = useOwnProfile();
  const { setVerification } = useAccount();
  const [verification, setLocal] = useState<Verification | null>(null);
  const [flow, setFlow] = useState<Flow>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (own.status === 'success' && own.data.profile) setLocal(own.data.profile.verification ?? { photo: 'unverified', id: 'unverified' });
  }, [own.status, own.data]);

  const run = async (kind: 'photo' | 'id') => {
    setBusy(true);
    setLocal((v) => v && { ...v, [kind]: 'pending' });
    await setVerification(kind, 'pending');
    await sleep(1200); // Pretend the provider is checking.
    const profile = await setVerification(kind, 'verified');
    setLocal(profile.verification ?? null);
    setBusy(false);
    setFlow(null);
    toast({ message: kind === 'photo' ? 'Photo verified' : 'ID verified' });
  };

  const badge = (state: string) =>
    state === 'verified' ? <span className="settings__badge settings__badge--ok"><Icon name="check" size={14} /> Verified</span> : state === 'pending' ? <span className="settings__badge">Checking…</span> : <span className="settings__badge">Not verified</span>;

  return (
    <Screen title="Verification" leading={<IconButton icon="chevronLeft" label="Back" onClick={() => navigate(-1)} />}>
      <p className="settings__intro">
        Verification shows that your photos are really you. It doesn't mean someone is safe, so keep using your judgement and meet in public.
      </p>
      {!verification ? (
        <LoadingRegion label="Loading"><Skeleton height={200} /></LoadingRegion>
      ) : (
        <>
          <div className="settings__card">
            <p className="settings__card-title">Photo verification {badge(verification.photo)}</p>
            <p>Take a quick selfie copying a pose. We compare it with your profile photos. Verified profiles show a badge next to their name.</p>
            {verification.photo !== 'verified' && <Button icon="camera" onClick={() => setFlow('photo')} disabled={busy}>Verify my photos</Button>}
          </div>
          <div className="settings__card">
            <p className="settings__card-title">ID verification {badge(verification.id)}</p>
            <p>Optional. Confirms your name and age match a government ID. Your ID is never shown to anyone.</p>
            {verification.id !== 'verified' && <Button variant="secondary" icon="verified" onClick={() => setFlow('id')} disabled={busy}>Verify my ID</Button>}
          </div>
          <p className="settings__note"><span className="settings__badge">Demo</span> No camera, biometric or ID service is used here. Verification is simulated.</p>
        </>
      )}

      <BottomSheet
        open={flow !== null}
        onClose={() => !busy && setFlow(null)}
        title={flow === 'photo' ? 'Copy this pose' : 'Verify your ID'}
        footer={
          <Button size="lg" block onClick={() => void run(flow!)} disabled={busy}>
            {busy ? 'Checking…' : flow === 'photo' ? 'Take selfie' : 'Upload ID'}
          </Button>
        }
      >
        <div className="settings__pose">
          <div className="settings__pose-frame" aria-hidden="true">
            <Icon name={flow === 'photo' ? 'user' : 'verified'} size={56} />
          </div>
          <p>{flow === 'photo' ? 'Hold your phone at eye level and give a thumbs up.' : 'Photograph the front of your ID in good light.'}</p>
        </div>
      </BottomSheet>
    </Screen>
  );
}
