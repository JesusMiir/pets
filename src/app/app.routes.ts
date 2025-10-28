import { Routes } from '@angular/router';
import { Layout } from './layout/layout';
import { Home } from './pages/home/home';
import { PetDetail } from './pages/pet-detail/pet-detail';
import { PotdPage } from './pages/potd/potd';

export const routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: '', component: Home },
      // { path: 'pet-of-the-day', component: PotdPage },
      { path: 'pets/:id', component: PetDetail },
      { path: '**', redirectTo: '' },
    ],
  },
];
