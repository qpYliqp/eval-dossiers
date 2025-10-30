import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { DynamicFormComponent } from './dynamic-form.component';
import { provideAnimations } from '@angular/platform-browser/animations';

describe('DynamicFormComponent (Standalone)', () => {
  let component: DynamicFormComponent;
  let fixture: ComponentFixture<DynamicFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Dans l'environnement standalone, nous importons directement le composant
      imports: [DynamicFormComponent],
      providers: [
        provideAnimations()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicFormComponent);
    component = fixture.componentInstance;
    
    // Configuration de base pour les tests
    component.formConfig = [
      {
        id: 'name',
        name: 'name',
        type: 'text',
        label: 'Nom',
        required: true,
        placeholder: 'Entrez votre nom'
      },
      {
        id: 'description',
        name: 'description',
        type: 'textarea',
        label: 'Description',
        required: false
      },
      {
        id: 'date',
        name: 'date',
        type: 'date',
        label: 'Date',
        required: true
      },
      {
        id: 'category',
        name: 'category',
        type: 'select',
        label: 'Catégorie',
        required: true,
        options: [
          { value: 'cat1', label: 'Catégorie 1' },
          { value: 'cat2', label: 'Catégorie 2' }
        ]
      }
    ];
    
    component.formData = {};
    component.formHeader = 'Test Form';
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should display the correct form header', () => {
    const headerElement = fixture.debugElement.query(By.css('.title')).nativeElement;
    expect(headerElement.textContent).toContain('Test Form');
  });

  it('should render all form fields based on formConfig', () => {
    const formGroups = fixture.debugElement.queryAll(By.css('.form-group'));
    expect(formGroups.length).toBe(component.formConfig.length);

    // Vérifier les types des champs
    const textInput = fixture.debugElement.query(By.css('input[type="text"]'));
    const textarea = fixture.debugElement.query(By.css('textarea'));
    const dateInput = fixture.debugElement.query(By.css('input[type="date"]'));
    const select = fixture.debugElement.query(By.css('select'));

    expect(textInput).toBeTruthy();
    expect(textarea).toBeTruthy();
    expect(dateInput).toBeTruthy();
    expect(select).toBeTruthy();
  });

  it('should display labels correctly for each field', () => {
    const labels = fixture.debugElement.queryAll(By.css('label'));
    expect(labels.length).toBe(component.formConfig.length);
    
    component.formConfig.forEach((field, index) => {
      expect(labels[index].nativeElement.textContent).toContain(field.label);
    });
  });

  it('should emit formSubmit event with form data when valid form is submitted', fakeAsync(() => {
    spyOn(component.formSubmit, 'emit');
    
    // Attendre que le formulaire soit initialisé
    fixture.detectChanges();
    tick();
    
    // Accéder aux contrôles du formulaire et les définir comme valides
    const nameControl = component.formRef.form.get('name');
    const dateControl = component.formRef.form.get('date');
    const categoryControl = component.formRef.form.get('category');
    
    // Définir les valeurs
    if (nameControl) nameControl.setValue('Test User');
    if (dateControl) dateControl.setValue('2023-01-01');
    if (categoryControl) categoryControl.setValue('cat1');
    
    // Mettre à jour le formData (bien que cela devrait déjà être fait par le binding)
    component.formData = {
      name: 'Test User',
      date: '2023-01-01',
      category: 'cat1'
    };
    
    // Marquer les contrôles comme touchés et valides
    component.formRef.form.markAllAsTouched();
    component.formRef.form.updateValueAndValidity();
    
    // Forcer une détection de changements après les mises à jour
    fixture.detectChanges();
    tick();
    
    // Vérifier manuellement que le formulaire est considéré comme valide
    expect(component.formRef.invalid).toBeFalsy('Le formulaire devrait être valide');
    
    // Simuler la soumission du formulaire
    component.submitForm();
    
    expect(component.formSubmit.emit).toHaveBeenCalledWith(component.formData);
  }));

  it('should not emit formSubmit event when form is invalid', () => {
    spyOn(component.formSubmit, 'emit');
    spyOn(console, 'log');
    
    // Ne pas remplir les champs requis
    component.formData = {};
    
    // Marquer le formulaire comme touché et invalide
    component.formRef.form.markAllAsTouched();
    component.formRef.form.setErrors({'invalid': true});
    
    // Simuler la soumission du formulaire
    component.submitForm();
    
    expect(component.formSubmit.emit).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Formulaire invalide');
  });

  it('should emit formCancel event when cancel button is clicked', () => {
    spyOn(component.formCancel, 'emit');
    
    component.cancelForm();
    
    expect(component.formCancel.emit).toHaveBeenCalled();
  });

  it('should update formData when input values change', fakeAsync(() => {
    // Obtenir le premier champ input (de type texte)
    const textInput = fixture.debugElement.query(By.css('input[type="text"]')).nativeElement;
    
    // Simuler la saisie d'une valeur
    textInput.value = 'Nouveau nom';
    textInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    tick(); // Avancer le temps pour les opérations asynchrones
    
    expect(component.formData.name).toBe('Nouveau nom');
  }));

  it('should show validation errors when submitting empty required fields', fakeAsync(() => {
    // Remplir d'abord le formulaire avec des données valides
    component.formData = {};
    
    // Simuler la soumission du formulaire
    const form = fixture.debugElement.query(By.css('form')).nativeElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    tick();
    
    // Forcer le changement de détection après les validations
    fixture.detectChanges();
    
    // Vérifier l'affichage des messages d'erreur
    const errorMessages = fixture.debugElement.queryAll(By.css('.error-message'));
    expect(errorMessages.length).toBeGreaterThan(0);
  }));

  it('should render select options correctly', () => {
    const selectField = component.formConfig.find(field => field.type === 'select');
    const options = fixture.debugElement.queryAll(By.css('option'));
    
    // +1 pour l'option "Sélectionner une option"
    expect(options.length).toBe((selectField?.options?.length || 0) + 1);
    
    // Vérifier que la première option est désactivée (placeholder)
    expect(options[0].nativeElement.disabled).toBe(true);
    expect(options[0].nativeElement.textContent.trim()).toBe('Sélectionner une option');
    
    // Vérifier les autres options
    selectField?.options.forEach((option: { value: any; label: any; }, index: number) => {
      expect(options[index + 1].nativeElement.value).toBe(option.value);
      expect(options[index + 1].nativeElement.textContent.trim()).toBe(option.label);
    });
  });

  it('should have correct button text', () => {
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    expect(buttons.length).toBe(2);
    expect(buttons[0].nativeElement.textContent).toContain('Annuler');
    expect(buttons[1].nativeElement.textContent).toContain('Confirmer');
  });
});