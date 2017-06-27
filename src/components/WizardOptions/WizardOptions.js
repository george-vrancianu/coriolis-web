/*
Copyright (C) 2017  Cloudbase Solutions SRL

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import React, { Component, PropTypes } from 'react';
import Reflux from 'reflux';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import s from './WizardOptions.scss';
import Dropdown from '../NewDropdown';
import WizardActions from '../../actions/WizardActions';
import WizardStore from '../../stores/WizardStore';
import InfoIcon from '../InfoIcon';


const title = 'Migration Options';

class WizardOptions extends Reflux.Component {

  static contextTypes = {
    onSetTitle: PropTypes.func.isRequired,
  };
  static propTypes = {
    setWizardState: PropTypes.func
  }

  constructor(props) {
    super(props)
    this.store = WizardStore

    this.diskFormats = ["VHD", "VHD2"]
    this.fipPools = ["public", "private_01", "private_02"]


    this.state = {
      autoFlavors: true,
      diskFormat: "VHD",
      fipPool: "public",
      valid: true,
      nextStep: "WizardSchedule",
      formSubmitted: false,
      showAdvancedOptions: false
    }
  }

  componentWillMount() {
    super.componentWillMount.call(this)
    this.props.setWizardState(this.state)
    this.context.onSetTitle(title)
  }

  componentDidMount() {
    let destination_environment = this.state.destination_environment
    this.state.targetCloud.cloudRef["import_" + this.state.migrationType].fields.forEach(field => {
      if (typeof field.default !== "undefined" && typeof destination_environment[field.name] === "undefined") {
        destination_environment[field.name] = field.default
      }
    }, this)

    WizardActions.updateWizardState({ destination_environment: destination_environment })
  }

  handleChangeAutoFlavor() {
    this.setState({ autoFlavors: !this.state.autoFlavors }, this.updateWizard)
  }

  handleChangeDiskFormat(value) {
    this.setState({ diskFormat: value }, this.updateWizard)
  }

  handleChangeFipPool(value) {
    this.setState({ fipPool: value }, this.updateWizard)
  }

  updateWizard() {
    this.props.setWizardState(this.state)
  }

  isValid(field) {
    if (field.required && this.state.formSubmitted) {
      if (this.state.currentCloudData[field.name].length == 0) {
        return false
      } else {
        return true
      }
    } else {
      return true
    }
  }

  toggleAdvancedOptions() {
    this.setState({ showAdvancedOptions: !this.state.showAdvancedOptions })
  }

  handleOptionsFieldChange(e, field) {
    let destination_environment = this.state.destination_environment
    if (field.type == 'dropdown') {
      destination_environment[field.name] = e
    } else {
      destination_environment[field.name] = e.target.value
    }
    WizardActions.updateWizardState({ destination_environment: destination_environment })
  }

  renderField(field) {
    let returnValue
    let extraClasses = ""
    if (field.required) {
      extraClasses += "required"
    }
    if (this.state.showAdvancedOptions) {
      extraClasses += " showAdvanced"
    }
    if (!this.isValid(field)) {
      extraClasses += " error"
    }
    switch (field.type) {
      case "text":
        returnValue = (
          <div
            className={"form-group " + extraClasses}
            key={"cloudField_" + field.name}
          >
            <h3>{field.label + (field.required ? " *" : "")}</h3>
            <input
              type="text"
              placeholder={field.label + (field.required ? " *" : "")}
              onChange={(e) => this.handleOptionsFieldChange(e, field)}
              value={this.state.destination_environment[field.name]}
            />
          </div>
        )
        break;
      case "password":
        returnValue = (
          <div
            className={"form-group " + extraClasses}
            key={"cloudField_" + field.name}
          >
            <h3>{field.label + (field.required ? " *" : "")}</h3>
            <input
              type="password"
              placeholder={field.label + (field.required ? " *" : "")}
              onChange={(e) => this.handleOptionsFieldChange(e, field)}
              value={this.state.destination_environment[field.name]}
            />
          </div>
        )
        break;
      case "dropdown":
        returnValue = (
          <div
            className={"form-group " + extraClasses}
            key={"cloudField_" + field.name}
          >
            <h3>{field.label + (field.required ? " *" : "")}</h3>
            <Dropdown
              options={field.options}
              onChange={(e) => this.handleOptionsFieldChange(e, field)}
              placeholder={field.label + (field.required ? " *" : "")}
              value={this.state.destination_environment[field.name]}
            />
          </div>
        )
        break;
      case "switch-radio":
        let fields = ""
        field.options.forEach((option) => {
          if (option.value == this.state.currentCloudData[field.name]) {
            fields = option.fields.map((optionField) => this.renderField(optionField))
          }
        })
        let radioOptions = field.options.map((option, key) => (
            <div key={"radio_option_" + key} className={s.radioOption}>
              <input
                type="radio"
                value={option.value}
                id={option.name}
                checked={option.value == this.state.destination_environment[field.name]}
                onChange={(e) => this.handleOptionsFieldChange(e, field)}
              /> <label htmlFor={option.name}>{option.label}</label>
            </div>
          )
        )
        returnValue = (
          <div key={"cloudField_" + field.name}>
            <div className="form-group switch-radio" key={"cloudField_" + field.name}>
              { radioOptions }
            </div>
            <div></div>
            {fields}
          </div>
        )
        break;
      default:
        break
    }
    return returnValue
  }

  renderOptionsFields(fields) {
    if (this.state.currentCloudData == null) {
      this.setState({ currentCloudData: {} })
    }
    if (!this.state.isConnecting) {
      let optionFields = fields.map(field => this.renderField(field), this)
      return (
        <div className={s.optionsFieldsContainer}>
          {optionFields}
        </div>
      )
    } else {
      return (
        <div className={s.connecting}>
          <div className={s.loadingImg}></div>
          <div className={s.text}>Connecting ...</div>
        </div>)
    }
  }

  render() {
    let toggleAdvancedBtn = <button
      onClick={(e) => this.toggleAdvancedOptions(e)}
      className={s.toggleAdvancedBtn + " wire"}
    >
      {this.state.showAdvancedOptions ? "Hide" : "Show"} Advanced Options
    </button>

    return (
      <div className={s.root}>
        <div className={s.container}>
          <div className={s.containerCenter}>
            {this.renderOptionsFields(this.state.targetCloud.cloudRef["import_" + this.state.migrationType].fields)}
          </div>
          {toggleAdvancedBtn}
        </div>
      </div>
    );
  }

}

export default withStyles(WizardOptions, s);
