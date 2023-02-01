import { Box, Tab, Tabs } from '@mui/material';
import { T } from '@tolgee/react';
import { useEffect, useState } from 'react';
import { PermissionsAdvanced } from 'tg.ee/PermissionsAdvanced/PermissionsAdvanced';

import { PermissionsBasic } from './PermissionsBasic';
import {
  PermissionAdvanced,
  PermissionBasic,
  PermissionModel,
  PermissionSettingsState,
  TabsType,
} from './types';

type Props = {
  permissions: PermissionModel;
  onChange: (state: PermissionSettingsState) => void;
};

export const PermissionsSettings: React.FC<Props> = ({
  permissions,
  onChange,
}) => {
  const [tab, setTab] = useState<TabsType>(
    permissions.type ? 'basic' : 'advanced'
  );

  const [basic, setBasic] = useState<PermissionBasic>({
    role: permissions.type,
    viewLanguages: permissions.viewLanguageIds,
    languages: permissions.permittedLanguageIds,
    stateChangeLanguages: permissions.stateChangeLanguageIds,
  });

  const [advanced, setAdvanced] = useState<PermissionAdvanced>({
    scopes: permissions.scopes,
  });

  useEffect(() => {
    onChange({
      tab,
      basic,
      advanced,
    });
  }, [tab, basic, advanced]);

  const handleChange = (_: React.SyntheticEvent, newValue: TabsType) => {
    setTab(newValue);
  };

  return (
    <div>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tab}
          onChange={handleChange}
          aria-label="basic tabs example"
        >
          <Tab label={<T keyName="permission_basic_title" />} value={'basic'} />
          <Tab
            label={<T keyName="permission_advanced_title" />}
            value={'advanced'}
          />
        </Tabs>
      </Box>
      <Box sx={{ mt: 1 }}>
        {tab === 'basic' && (
          <PermissionsBasic state={basic} onChange={setBasic} />
        )}
        {tab === 'advanced' && (
          <PermissionsAdvanced state={advanced} onChange={setAdvanced} />
        )}
      </Box>
    </div>
  );
};