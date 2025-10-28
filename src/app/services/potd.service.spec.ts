import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { PotdService } from './potd.service';
import { PetsService, PetsPage } from './pets.service';
import { of } from 'rxjs';
import { Pet } from '../models/pet.model';

function makePet(id: number, kind: Pet['kind'] = 'dog'): Pet {
  return {
    id,
    name: `Pet ${id}`,
    kind,
    weight: 5000,
    height: 30,
    length: 50,
    description: '',
    photo_url: '',
  } as Pet;
}

function makePetsPage(ids: number[], kind: Pet['kind'] = 'dog'): PetsPage {
  const items = ids.map((id) => makePet(id, kind));
  return {
    items,
    total: items.length,
    page: 1,
    limit: items.length || 1,
  } as PetsPage;
}

describe('PotdService', () => {
  let service: PotdService;
  let petsSvcMock: jasmine.SpyObj<PetsService>;
  const FIXED_TODAY = new Date('2025-10-22T12:00:00');

  beforeAll(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(FIXED_TODAY);
  });

  afterAll(() => {
    jasmine.clock().uninstall();
  });

  beforeEach(() => {
    petsSvcMock = jasmine.createSpyObj('PetsService', ['getPetsPage']);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: PetsService, useValue: petsSvcMock },
      ],
    });
    localStorage.clear();
    service = TestBed.inject(PotdService);
    spyOn(service as any, 'shuffle').and.callFake(<T>(arr: T[]) => [...arr]);
  });

  it('should create service', () => {
    expect(service).toBeTruthy();
  });

  it('getTodayPetId should return id from localStorage if valid state exists', (done) => {
    const state = {
      start: '2025-10-01',
      days: [
        { date: '2025-10-21', id: 3 },
        { date: '2025-10-22', id: 7 },
        { date: '2025-10-23', id: 9 },
      ],
    };
    localStorage.setItem('pet-of-the-day', JSON.stringify(state));
    petsSvcMock.getPetsPage.and.returnValue(of(makePetsPage([1, 2, 3])));
    service.getTodayPetId().subscribe((id) => {
      expect(id).toBe(7);
      expect(petsSvcMock.getPetsPage).not.toHaveBeenCalled();
      done();
    });
  });

  it('getTodayPetId should rebuild state if expired and use backend ids', (done) => {
    const expired = {
      start: '2025-08-01',
      days: [{ date: '2025-08-01', id: 1 }],
    };
    localStorage.setItem('pet-of-the-day', JSON.stringify(expired));
    petsSvcMock.getPetsPage.and.returnValue(of(makePetsPage([10, 11, 12, 13, 14])));
    service.getTodayPetId().subscribe((id) => {
      expect(id).toBe(10);
      const raw = localStorage.getItem('pet-of-the-day');
      const saved = JSON.parse(raw!);
      expect(saved.start).toBe('2025-10-22');
      expect(saved.days.length).toBe(31);
      const today = saved.days.find((d: any) => d.date === '2025-10-22');
      expect(today.id).toBe(10);
      done();
    });
  });

  it('getTodayPetId should use fallback ids if backend returns empty', (done) => {
    petsSvcMock.getPetsPage.and.returnValue(of(makePetsPage([])));
    service.getTodayPetId().subscribe((id) => {
      expect(id).toBe(1);
      done();
    });
  });

  it('getPetIdFor should return id from localStorage if valid state exists', (done) => {
    const state = {
      start: '2025-10-01',
      days: [
        { date: '2025-10-22', id: 4 },
        { date: '2025-10-23', id: 5 },
      ],
    };
    localStorage.setItem('pet-of-the-day', JSON.stringify(state));
    service.getPetIdFor('2025-10-23').subscribe((id) => {
      expect(id).toBe(5);
      expect(petsSvcMock.getPetsPage).not.toHaveBeenCalled();
      done();
    });
  });

  it('getPetIdFor should rebuild and return id for given date if needed', (done) => {
    localStorage.removeItem('pet-of-the-day');
    petsSvcMock.getPetsPage.and.returnValue(of(makePetsPage([2, 4, 6])));
    service.getPetIdFor('2025-10-25').subscribe((id) => {
      expect(id).toBe(2);
      const saved = JSON.parse(localStorage.getItem('pet-of-the-day')!);
      expect(saved.start).toBe('2025-10-22');
      done();
    });
  });

  it('resolveToday should set todayId if today exists in state', () => {
    localStorage.clear();
    const state = {
      start: '2025-10-20',
      days: [
        { date: '2025-10-21', id: 100 },
        { date: '2025-10-22', id: 101 },
      ],
    };
    localStorage.setItem('pet-of-the-day', JSON.stringify(state));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: PetsService, useValue: petsSvcMock },
      ],
    });
    const testService = TestBed.inject(PotdService);
    spyOn(testService as any, 'shuffle').and.callFake(<T>(arr: T[]) => [...arr]);
    expect(testService.todayId()).toBe(101);
  });

  it('resolveToday should set todayId to null if today not in state', () => {
    localStorage.clear();
    const state = {
      start: '2025-10-20',
      days: [{ date: '2025-10-21', id: 100 }],
    };
    localStorage.setItem('pet-of-the-day', JSON.stringify(state));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: PetsService, useValue: petsSvcMock },
      ],
    });
    const testService = TestBed.inject(PotdService);
    spyOn(testService as any, 'shuffle').and.callFake(<T>(arr: T[]) => [...arr]);
    expect(testService.todayId()).toBeNull();
  });
});
