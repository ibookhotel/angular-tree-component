import {VirtualComponent} from './virtual.component';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {DebugElement} from '@angular/core';
import {By} from '@angular/platform-browser';

describe('Pagination model unit test', () => {

  let comp:    VirtualComponent;
  let fixture: ComponentFixture<VirtualComponent>;
  let de:      DebugElement;
  let el:      HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ VirtualComponent ], // declare the test component
    });

    fixture = TestBed.createComponent(VirtualComponent);

    comp = fixture.componentInstance; // BannerComponent test instance

    // query for the title <h1> by CSS element selector
    de = fixture.debugElement.query(By.css('h1'));
    el = de.nativeElement;
  });

});
