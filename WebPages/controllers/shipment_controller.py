from flask import render_template, request, redirect, url_for
from models.shipment_model import Shipment
from database import db
from datetime import datetime

def create_shipment():
    if request.method == 'POST':
        new_shipment = Shipment(
            order_id=request.form['order_id'],
            shipment_method=request.form['shipment_method'],
            shipment_date=datetime.strptime(request.form['shipment_date'], '%Y-%m-%d'),
            address=request.form['address']
        )
        db.session.add(new_shipment)
        db.session.commit()
        return redirect(url_for('view_shipments'))
    return render_template('shipment/create_shipment.html')

def view_shipments():
    shipments = Shipment.query.all()
    return render_template('shipment/view_shipments.html', shipments=shipments)

def update_shipment(shipment_id):
    shipment = Shipment.query.get(shipment_id)
    if request.method == 'POST':
        shipment.shipment_method = request.form['shipment_method']
        shipment.shipment_date = datetime.strptime(request.form['shipment_date'], '%Y-%m-%d')
        shipment.address = request.form['address']
        db.session.commit()
        return redirect(url_for('view_shipments'))
    return render_template('shipment/update_shipment.html', shipment=shipment)

def delete_shipment(shipment_id):
    shipment = Shipment.query.get(shipment_id)
    db.session.delete(shipment)
    db.session.commit()
    return redirect(url_for('view_shipments'))
