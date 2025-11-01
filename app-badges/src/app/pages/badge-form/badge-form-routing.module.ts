import { RouterModule, Routes } from "@angular/router";
import { BadgeFormComponent } from "./badge-form.component";
import { NgModule } from "@angular/core";

const routes: Routes = [
    {
        path: '',
        component: BadgeFormComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class BadgeFormRoutingModule {}