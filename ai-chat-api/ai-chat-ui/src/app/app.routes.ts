import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/personality-list/personality-list.component').then(
        (m) => m.PersonalityListComponent,
      ),
  },
  {
    path: 'personalities/new',
    loadComponent: () =>
      import('./components/personality-create/personality-create.component').then(
        (m) => m.PersonalityCreateComponent,
      ),
  },
  {
    path: 'personalities/:slug/edit',
    loadComponent: () =>
      import('./components/personality-edit/personality-edit.component').then(
        (m) => m.PersonalityEditComponent,
      ),
  },
  {
    path: 'chat/:slug',
    loadComponent: () =>
      import('./components/chat/chat.component').then((m) => m.ChatComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
