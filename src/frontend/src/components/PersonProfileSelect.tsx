import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetAllProfiles } from '../hooks/usePeopleProfilesQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Principal } from '@icp-sdk/core/principal';
import { User } from 'lucide-react';

interface PersonProfileSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  showMeButton?: boolean;
}

export function PersonProfileSelect({
  value,
  onChange,
  label = 'Assigned To',
  placeholder = 'Select a person or enter Principal ID',
  showMeButton = true,
}: PersonProfileSelectProps) {
  const [mode, setMode] = useState<'select' | 'manual'>('select');
  const { data: profiles = [] } = useGetAllProfiles();
  const { identity } = useInternetIdentity();

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === '__manual__') {
      setMode('manual');
      onChange('');
    } else {
      onChange(selectedValue);
    }
  };

  const assignToMe = () => {
    if (identity) {
      onChange(identity.getPrincipal().toString());
      setMode('manual');
    }
  };

  const switchToSelect = () => {
    setMode('select');
    onChange('');
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {mode === 'select' ? (
        <div className="space-y-2">
          <Select value={value} onValueChange={handleSelectChange}>
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((profile) => (
                <SelectItem key={profile.principal.toString()} value={profile.principal.toString()}>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: profile.color }}
                    />
                    {profile.displayName}
                  </div>
                </SelectItem>
              ))}
              <SelectItem value="__manual__">
                <span className="text-muted-foreground">Enter Principal ID manually...</span>
              </SelectItem>
            </SelectContent>
          </Select>
          {profiles.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No profiles yet. Switch to manual entry or add profiles in the People tab.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Principal ID"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1"
            />
            {showMeButton && (
              <Button type="button" variant="outline" onClick={assignToMe}>
                Me
              </Button>
            )}
          </div>
          {profiles.length > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={switchToSelect}>
              ← Back to profile selection
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            Enter a principal ID or click "Me" to assign to yourself
          </p>
        </div>
      )}
    </div>
  );
}
