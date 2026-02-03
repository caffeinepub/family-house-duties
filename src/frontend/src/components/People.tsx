import { useState } from 'react';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGetAllProfiles, useUpsertProfile, useDeleteProfile } from '../hooks/usePeopleProfilesQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Skeleton } from '@/components/ui/skeleton';
import { PersonBadge } from './PersonBadge';
import type { PersonProfile } from '../backend';
import { Principal } from '@icp-sdk/core/principal';

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
];

export function People() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<PersonProfile | null>(null);
  const [principalInput, setPrincipalInput] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  const { identity } = useInternetIdentity();
  const { data: profiles = [], isLoading } = useGetAllProfiles();
  const upsertProfile = useUpsertProfile();
  const deleteProfile = useDeleteProfile();

  const currentUserPrincipal = identity?.getPrincipal().toString();

  const handleOpenAdd = () => {
    setPrincipalInput('');
    setDisplayName('');
    setSelectedColor(PRESET_COLORS[0]);
    setIsAddDialogOpen(true);
  };

  const handleOpenEdit = (profile: PersonProfile) => {
    setPrincipalInput(profile.principal.toString());
    setDisplayName(profile.displayName);
    setSelectedColor(profile.color);
    setEditingProfile(profile);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingProfile(null);
    setPrincipalInput('');
    setDisplayName('');
    setSelectedColor(PRESET_COLORS[0]);
  };

  const handleSave = () => {
    if (!displayName.trim()) {
      return;
    }

    let principal: Principal;
    try {
      principal = Principal.fromText(principalInput.trim());
    } catch (error) {
      // If invalid principal, use current user's principal
      if (identity) {
        principal = identity.getPrincipal();
      } else {
        return;
      }
    }

    const profile: PersonProfile = {
      principal,
      displayName: displayName.trim(),
      color: selectedColor,
    };

    upsertProfile.mutate(profile, {
      onSuccess: () => {
        handleCloseDialog();
      },
    });
  };

  const handleDelete = (profile: PersonProfile) => {
    if (confirm(`Delete profile for ${profile.displayName}?`)) {
      deleteProfile.mutate(profile.principal);
    }
  };

  const canEditProfile = (profile: PersonProfile) => {
    return profile.principal.toString() === currentUserPrincipal;
  };

  const fillMyPrincipal = () => {
    if (identity) {
      setPrincipalInput(identity.getPrincipal().toString());
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">People</h2>
          <p className="text-muted-foreground mt-1">Manage family member profiles with names and colors</p>
        </div>
        <Button onClick={handleOpenAdd} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Add Person
        </Button>
      </div>

      {profiles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="mb-6 h-16 w-16 text-muted-foreground/50" />
            <p className="text-lg font-medium">No profiles yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add your first person profile to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <Card key={profile.principal.toString()}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: profile.color }}
                    >
                      {profile.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{profile.displayName}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {profile.principal.toString().slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  {canEditProfile(profile) && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenEdit(profile)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(profile)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <PersonBadge label={profile.displayName} color={profile.color} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isAddDialogOpen || !!editingProfile} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingProfile ? 'Edit Profile' : 'Add Person Profile'}</DialogTitle>
            <DialogDescription>
              {editingProfile
                ? 'Update the profile details.'
                : 'Create a profile with a name and color for easy identification.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="principal">Principal ID</Label>
              <div className="flex gap-2">
                <Input
                  id="principal"
                  placeholder="Principal ID"
                  value={principalInput}
                  onChange={(e) => setPrincipalInput(e.target.value)}
                  disabled={!!editingProfile}
                  className="flex-1"
                />
                {!editingProfile && (
                  <Button type="button" variant="outline" onClick={fillMyPrincipal}>
                    Me
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {editingProfile
                  ? 'Principal ID cannot be changed'
                  : 'Enter a principal ID or click "Me" to use your own'}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                placeholder="e.g., Mom, Dad, Sarah"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="grid grid-cols-8 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-10 w-10 rounded-full transition-all ${
                      selectedColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={upsertProfile.isPending || !displayName.trim()}>
              {upsertProfile.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
