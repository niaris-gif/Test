import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { IonicModule } from "@ionic/angular";
import { BadgeFormRoutingModule } from "./badge-form-routing.module";
import { BadgeFormComponent } from "./badge-form.component";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        BadgeFormRoutingModule
    ],
})
export class BadgeFormModule {}