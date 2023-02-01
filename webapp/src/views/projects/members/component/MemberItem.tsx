import { T, useTranslate } from '@tolgee/react';
import { container } from 'tsyringe';
import { Chip, styled } from '@mui/material';

import { PermissionsMenu } from 'tg.views/projects/members/component/PermissionsMenu';
import { LanguagePermissionsMenu } from 'tg.component/security/LanguagePermissionsMenu';
import { useProject } from 'tg.hooks/useProject';
import { useUser } from 'tg.globalContext/helpers';
import { MessageService } from 'tg.service/MessageService';
import { components } from 'tg.service/apiSchema.generated';
import { useApiMutation } from 'tg.service/http/useQueryApi';
import { parseErrorResponse } from 'tg.fixtures/errorFIxtures';
import RevokePermissionsButton from './RevokePermissionsButton';
import { useProjectPermissions } from 'tg.hooks/useProjectPermissions';

type UserAccountInProjectModel =
  components['schemas']['UserAccountInProjectModel'];

const messageService = container.resolve(MessageService);

const StyledListItem = styled('div')`
  display: flex;
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider2.main};
  &:last-child {
    border-bottom: 0;
  }
  position: relative;
  padding: ${({ theme }) => theme.spacing(1)};
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
`;

const StyledItemText = styled('div')`
  flex-grow: 1;
  padding: ${({ theme }) => theme.spacing(1)};
`;

const StyledItemActions = styled('div')`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  align-items: center;
  flex-wrap: wrap;
`;

type Props = {
  user: UserAccountInProjectModel;
};

export const MemberItem: React.FC<Props> = ({ user }) => {
  const project = useProject();
  const currentUser = useUser();
  const { t } = useTranslate();
  const { satisfiesPermission } = useProjectPermissions();
  const isAdmin = satisfiesPermission('admin');

  const editPermission = useApiMutation({
    url: '/v2/projects/{projectId}/users/{userId}/set-permissions/{permissionType}',
    method: 'put',
    invalidatePrefix: '/v2/projects/{projectId}/users',
  });

  const changePermission = (permissionType, languages, showMessage) => {
    editPermission.mutate(
      {
        path: {
          userId: user?.id,
          permissionType,
          projectId: project.id,
        },
        query: {
          languages: permissionType === 'TRANSLATE' ? languages : undefined,
        },
      },
      {
        onSuccess() {
          if (showMessage) {
            messageService.success(<T>permissions_set_message</T>);
          }
        },
        onError(e) {
          parseErrorResponse(e).forEach((err) =>
            messageService.error(<T>{err}</T>)
          );
        },
      }
    );
  };

  const projectPermissionType = user.directPermission?.type;
  const isCurrentUser = currentUser?.id === user.id;
  const isOwner = user.organizationRole === 'OWNER';

  return (
    <StyledListItem data-cy="project-member-item">
      <StyledItemText>
        {user.name} ({user.username}){' '}
        {user.organizationRole && (
          <Chip size="small" label={project.organizationOwner?.name} />
        )}
      </StyledItemText>
      <StyledItemActions>
        {projectPermissionType === 'TRANSLATE' && (
          <LanguagePermissionsMenu
            buttonProps={{ disabled: !isAdmin }}
            selected={user.computedPermission.permittedLanguageIds || []}
            onSelect={(langs) =>
              changePermission(projectPermissionType, langs, false)
            }
          />
        )}
        <PermissionsMenu
          user={user}
          buttonTooltip={
            isOwner && !isCurrentUser
              ? t('user_is_owner_of_organization_tooltip')
              : isOwner
              ? t('cannot_change_your_own_access_tooltip')
              : undefined
          }
          buttonProps={{
            size: 'small',
            disabled: !isAdmin || isCurrentUser || isOwner,
          }}
          permissions={user.computedPermission}
        />
        <RevokePermissionsButton user={user} />
      </StyledItemActions>
    </StyledListItem>
  );
};
