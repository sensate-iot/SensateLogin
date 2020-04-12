/*
 * Register form component.
 *
 * @author Michel Megens
 * @email  dev@bietje.net
 */

import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {Router} from '@angular/router';
import {DOCUMENT} from '@angular/common';
import {FormMatcher} from "../../matchers/form.matcher";
import {Status} from "../../models/status.model";
import {AlertService} from "../../clients/alert.service";
import {PhonenumberMatcher} from "../../matchers/phonenumber.matcher";
import {UserRegistration} from "../../models/user-registration.model";
import {AccountService} from "../../clients/account.service";
import {Title} from "@angular/platform-browser";
import {LoginService} from "../../clients/login.service";
import {AppsService} from "../../clients/apps.service";

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})

export class RegisterComponent implements OnInit, OnDestroy {
  registerForm : FormGroup;
  email : FormControl;
  firstName : FormControl;
  lastName : FormControl;
  phoneNumberControl : FormControl;
  password : FormControl;
  passwordConfirm : FormControl;
  countryCodeControl : FormControl;
  terms : boolean;

  private first : boolean;
  private readonly origin : string;
  private confirmPasswordSubscription : Subscription;

  public matcher : FormMatcher;
  public phoneMatcher : PhonenumberMatcher;

  constructor(private accounts : AccountService, private alerts : AlertService,
              private readonly title: Title,
              private readonly auth: LoginService,
              private readonly apps: AppsService,
              @Inject(DOCUMENT) private document : Window, private router : Router) {
    this.matcher = new FormMatcher();
    this.phoneMatcher = new PhonenumberMatcher();
    this.first = true;
    this.origin = encodeURI(this.document.location.origin);
    this.title.setTitle('Register | Sensate IoT')
  }

  public ngOnDestroy() {
    this.confirmPasswordSubscription.unsubscribe();
  }

  public ngOnInit() {
    if(this.auth.isLoggedIn()) {
      this.apps.forward('dashboard', '/overview');
    }

    this.email = new FormControl('', [
      Validators.email,
      Validators.required
    ]);

    this.passwordConfirm = new FormControl('', Validators.required);

    this.firstName = new FormControl('', Validators.required);
    this.lastName = new FormControl('', Validators.required);
    this.password = new FormControl('', Validators.required);
    this.phoneNumberControl = new FormControl('', [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(15)
    ]);

    this.countryCodeControl = new FormControl('', [
      Validators.required
    ]);

    this.registerForm = new FormGroup({
      email: this.email,
      password: this.password,
      passwordConfirm: this.passwordConfirm,
      firstName: this.firstName,
      lastName: this.lastName,
      phoneNumber: this.phoneNumberControl
    });

    this.watchConfirmPassword();
  }

  private watchConfirmPassword() {
    this.confirmPasswordSubscription = this.passwordConfirm.valueChanges.subscribe(() => {
      if(this.password.value.toString().length <= 0 ||
        this.password.value.toString() !== this.passwordConfirm.value.toString()) {
        this.passwordConfirm.setErrors({
          'not-equal': true
        });
      } else {
        this.passwordConfirm.setErrors(null);
      }
    });
  }

  public isValidForm() : boolean {
      return this.email.valid && this.firstName.valid && this.lastName.valid &&
        this.phoneNumberControl.valid && this.password.valid && this.passwordConfirm.valid && this.terms &&
        this.isValidPhoneNumber();
  }

  public isValidPhoneNumber() : boolean {
    /* Lookup phone number @backend */
    return true;
  }

  public onSubmitClicked() : void {
    this.first = false;
    const user = new UserRegistration();
    const loginUrl = this.origin + '/login';

    const phone = '+' + this.countryCodeControl.value.toString() + this.phoneNumberControl.value.toString();
    user.email = this.email.value.toString();
    user.firstName = this.firstName.value.toString();
    user.lastName = this.lastName.value.toString();
    user.password = this.password.value.toString();
    user.phoneNumber = phone;

    this.accounts.register(user, loginUrl).subscribe(() => {
      this.alerts.showNotification("A verification token has been sent to your email!", 'top-center', 'success');
      this.router.navigate(['/login']);
    }, error => {
      console.debug('Failed to register..');
      console.debug(error);
      console.debug(error.error);
      const msg : Status = error.error;
      const display = 'Unable to sign up: ' + msg.message;

      this.alerts.showNotification(display, 'top-center', 'danger');
    });
  }
}
